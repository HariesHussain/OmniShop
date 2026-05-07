import express from 'express';

const app = express();

app.get("/test", (req, res) => {
  res.json({
    success: true,
    express: true,
    minimal: true
  });
});

export default app;

/*
// TEMP DISABLED FOR EXPRESS BRIDGE DEBUGGING
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import Stripe from 'stripe';
import { Resend } from 'resend';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { createEmailNotifier } from './emails/service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.resolve(__dirname, '.env');
dotenv.config({ path: backendEnvPath, override: true });

// const app = express();
const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';
const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'OmniShop <noreply@omnishop.in>';

const logInfo = (...args) => {
    if (!isProduction) console.log(...args);
};
const logWarn = (...args) => {
    if (!isProduction) console.warn(...args);
};
const logError = (...args) => {
    if (!isProduction) console.error(...args);
};

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const emailNotifier = createEmailNotifier({ resend, fromEmail: resendFromEmail, logInfo, logError });

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin from environment variables
const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

const hasValidFirebaseAdminCredentials = Boolean(
    serviceAccount.projectId
    && serviceAccount.clientEmail
    && serviceAccount.privateKey
    && serviceAccount.privateKey.includes('BEGIN PRIVATE KEY')
    && !serviceAccount.privateKey.includes('YOUR_PRIVATE_KEY_CONTENT')
    && !serviceAccount.privateKey.includes('YOUR_KEY_CONTENT')
);

if (hasValidFirebaseAdminCredentials) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    logInfo('Firebase Admin Initialized successfully.');
} else {
    logWarn('Firebase Admin not initialized. Missing FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.');
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS
    || process.env.CLIENT_URL
    || process.env.FRONTEND_URL
    || (isProduction ? '' : 'http://localhost:5173'))
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true
}));
// Use raw body for Stripe webhook, JSON for everything else
app.use((req, res, next) => {
    if (req.originalUrl === '/api/stripe/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});

// Middleware to verify Firebase Auth Token
const verifyAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        logError('Auth Error:', error);
        res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
};

// --- Test Route ---
app.get('/', (req, res) => {
    res.json({ message: 'OmniShop Backend API is running!' });
});

app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        service: 'omnishop-backend',
        timestamp: new Date().toISOString(),
    });
});

// --- Resend Email Example ---
app.post('/api/emails/send', verifyAuth, async (req, res) => {
    const { to, subject, html } = req.body;
    try {
        const { data, error } = await resend.emails.send({
            from: resendFromEmail,
            to,
            subject,
            html,
        });
        if (error) {
            logError('Email Error:', error);
            return res.status(500).json({ error: error.message });
        }
        res.json({ success: true, data });
    } catch (error) {
        logError('Email Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- OTP Hardening Internals ---
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_SEND_WINDOW_MS = 10 * 60 * 1000;
const OTP_SEND_MAX_PER_IP = 20;
const OTP_SEND_MAX_PER_EMAIL = 5;
const OTP_VERIFY_WINDOW_MS = 10 * 60 * 1000;
const OTP_VERIFY_MAX_PER_IP = 40;
const OTP_VERIFY_MAX_PER_EMAIL = 10;
const otpPepper = process.env.OTP_HASH_SECRET || process.env.RESEND_API_KEY || 'omnishop-otp-fallback';
const sendBuckets = new Map();
const verifyBuckets = new Map();

const takeToken = (bucketMap, key, limit, windowMs) => {
    const now = Date.now();
    const current = bucketMap.get(key) || [];
    const valid = current.filter((ts) => now - ts < windowMs);

    if (valid.length >= limit) return false;

    valid.push(now);
    bucketMap.set(key, valid);
    return true;
};

const hashOtp = (email, otp) => crypto
    .createHash('sha256')
    .update(`${email.toLowerCase()}::${otp}::${otpPepper}`)
    .digest('hex');

const safeCompare = (a, b) => {
    const left = Buffer.from(a || '', 'utf8');
    const right = Buffer.from(b || '', 'utf8');
    if (left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
};

// --- Delivery Auto-Assignment ---
const DELIVERY_START_OFFSET_DAYS = Number(process.env.DELIVERY_START_OFFSET_DAYS || 7);
const MAX_DELIVERIES_PER_DAY = Number(process.env.MAX_DELIVERIES_PER_DAY || 10);
const MAX_DELIVERY_SEARCH_DAYS = Number(process.env.MAX_DELIVERY_SEARCH_DAYS || 30);

const toDateKey = (dateObj) => {
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const toEstimatedIso = (dateObj) => {
    const copy = new Date(dateObj);
    copy.setUTCHours(12, 0, 0, 0);
    return copy.toISOString();
};

const getCandidateDate = (offsetDays) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + offsetDays);
    date.setUTCHours(0, 0, 0, 0);
    return date;
};

const getActiveDeliveryBoys = async () => {
    const snap = await admin.firestore().collection('users').where('role', '==', 'delivery_boy').get();
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return rows
        .filter((u) => u?.is_active !== false && u?.delivery_enabled !== false)
        .map((u) => ({
            id: u.id,
            email: String(u.email || '').trim().toLowerCase(),
            name: String(u.full_name || u.email || u.id),
            offDates: Array.isArray(u.delivery_off_dates) ? new Set(u.delivery_off_dates.map((x) => String(x))) : new Set(),
        }))
        .filter((u) => Boolean(u.email));
};

const getDateLoadMap = async (dateKey, deliveryBoyIds) => {
    const loads = new Map();
    const createdAtMs = new Map();
    deliveryBoyIds.forEach((id) => {
        loads.set(id, 0);
        createdAtMs.set(id, Number.MAX_SAFE_INTEGER);
    });
    const snap = await admin.firestore()
        .collection('deliveryAssignments')
        .where('estimated_delivery_date_key', '==', dateKey)
        .get();

    snap.docs.forEach((docSnap) => {
        const data = docSnap.data() || {};
        const status = String(data.status || 'assigned');
        if (status === 'cancelled') return;
        const id = String(data.delivery_boy_id || '');
        if (!loads.has(id)) return;
        loads.set(id, (loads.get(id) || 0) + 1);
        const created = data.created_date?.toMillis ? data.created_date.toMillis() : new Date(data.created_date || Date.now()).getTime();
        createdAtMs.set(id, Math.min(createdAtMs.get(id) || Number.MAX_SAFE_INTEGER, created));
    });

    return { loads, createdAtMs };
};

const findDeliverySlot = async () => {
    const deliveryBoys = await getActiveDeliveryBoys();
    if (deliveryBoys.length === 0) {
        return { found: false, reason: 'NO_ACTIVE_DELIVERY_BOYS' };
    }

    for (let i = 0; i < MAX_DELIVERY_SEARCH_DAYS; i += 1) {
        const date = getCandidateDate(DELIVERY_START_OFFSET_DAYS + i);
        const dateKey = toDateKey(date);
        const { loads } = await getDateLoadMap(dateKey, deliveryBoys.map((d) => d.id));

        const available = deliveryBoys.filter((d) => {
            if (d.offDates.has(dateKey)) return false;
            return (loads.get(d.id) || 0) < MAX_DELIVERIES_PER_DAY;
        });
        if (available.length === 0) continue;

        available.sort((a, b) => {
            const loadDiff = (loads.get(a.id) || 0) - (loads.get(b.id) || 0);
            if (loadDiff !== 0) return loadDiff;
            return a.id.localeCompare(b.id);
        });
        const selected = available[0];
        return {
            found: true,
            selected,
            estimatedDate: date,
            estimatedDateIso: toEstimatedIso(date),
            estimatedDateKey: dateKey,
            loadForSelected: loads.get(selected.id) || 0,
        };
    }

    return { found: false, reason: 'CAPACITY_OVERFLOW' };
};


// --- OTP Endpoints ---
app.post('/api/otp/send', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        logError('[OTP] Error: Email is missing in request body');
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const normalizedEmail = String(email).trim().toLowerCase();
        const requestIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';

        if (!takeToken(sendBuckets, `send:ip:${requestIp}`, OTP_SEND_MAX_PER_IP, OTP_SEND_WINDOW_MS)) {
            return res.status(429).json({ error: 'Too many requests. Please try again later.' });
        }
        if (!takeToken(sendBuckets, `send:email:${normalizedEmail}`, OTP_SEND_MAX_PER_EMAIL, OTP_SEND_WINDOW_MS)) {
            return res.status(429).json({ error: 'Too many requests. Please try again later.' });
        }

        const otpRef = admin.firestore().collection('otps').doc(normalizedEmail);
        const existingDoc = await otpRef.get();
        if (existingDoc.exists) {
            const existingData = existingDoc.data();
            if (existingData?.lastSentAt && Date.now() - Number(existingData.lastSentAt) < OTP_COOLDOWN_MS) {
                return res.status(429).json({ error: 'Please wait before requesting another OTP' });
            }
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + OTP_TTL_MS;

        await otpRef.set({
            otp_hash: hashOtp(normalizedEmail, otp),
            expiresAt,
            attempts: 0,
            lastSentAt: Date.now(),
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            request_ip: String(requestIp),
        });

        const { data, error } = await resend.emails.send({
            from: resendFromEmail,
            to: normalizedEmail,
            subject: 'Your OmniShop Verification Code',
            html: \`
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #fb923c; text-align: center;">Welcome to OmniShop!</h2>
                    <p>Use the following code to verify your email address:</p>
                    <div style="background: #fff7ed; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ea580c; border-radius: 8px; margin: 20px 0;">
                        \${otp}
                    </div>
                    <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes. If you didn't request this, you can safely ignore this email.</p>
                </div>
            \`,
        });

        if (error) {
            logError('[OTP] Resend Error:', error);
            return res.status(500).json({ error: error.message });
        }

        logInfo(\`[OTP] Resend success for \${normalizedEmail}:\`, data);
        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        logError('[OTP] Detailed Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/otp/verify', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    try {
        const normalizedEmail = String(email).trim().toLowerCase();
        const requestIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';

        if (!takeToken(verifyBuckets, `verify:ip:${requestIp}`, OTP_VERIFY_MAX_PER_IP, OTP_VERIFY_WINDOW_MS)) {
            return res.status(429).json({ error: 'Too many verification attempts. Please try again later.' });
        }
        if (!takeToken(verifyBuckets, `verify:email:${normalizedEmail}`, OTP_VERIFY_MAX_PER_EMAIL, OTP_VERIFY_WINDOW_MS)) {
            return res.status(429).json({ error: 'Too many verification attempts. Please try again later.' });
        }

        const otpRef = admin.firestore().collection('otps').doc(normalizedEmail);
        const otpDoc = await otpRef.get();
        if (!otpDoc.exists) {
            return res.status(400).json({ error: 'No OTP found for this email' });
        }

        const data = otpDoc.data();
        if (Date.now() > Number(data.expiresAt || 0)) {
            await otpRef.delete();
            return res.status(400).json({ error: 'OTP has expired' });
        }

        if ((data.attempts || 0) >= OTP_MAX_ATTEMPTS) {
            return res.status(429).json({ error: 'Too many verification attempts. Please request a new OTP.' });
        }

        const isValid = safeCompare(data.otp_hash, hashOtp(normalizedEmail, String(otp).trim()));
        if (!isValid) {
            await otpRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // OTP is valid, delete it
        await otpRef.delete();
        res.json({ success: true, message: 'OTP verified successfully' });
    } catch (error) {
        logError('OTP Verify Error:', error);
        res.status(500).json({ error: error.message });
    }
});


app.post('/api/orders/finalize', verifyAuth, async (req, res) => {
    try {
        const { buyer_name, items, total_amount, shipping_address, payment_method, payment_status } = req.body || {};
        if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Invalid cart items' });
        if (!shipping_address || !shipping_address.address) return res.status(400).json({ error: 'Invalid shipping address' });
        if (!['COD', 'Card', 'UPI'].includes(String(payment_method || ''))) return res.status(400).json({ error: 'Invalid payment method' });

        const normalizedItems = items.map((item) => {
            const price = Number(item.price);
            const quantity = Number(item.quantity);
            const title = String(item.title || '').trim();
            const productId = String(item.product_id || '').trim();
            if (!title || !productId || !Number.isFinite(price) || price <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
                throw new Error('Invalid order item payload');
            }
            return {
                product_id: productId,
                title,
                price,
                quantity,
                image: item.image || '',
                seller_email: item.seller_email || '',
                cart_item_id: item.cart_item_id || null,
            };
        });

        const subtotal = normalizedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 500 ? 0 : 49;
        const expectedAmount = Number((subtotal + shipping).toFixed(2));
        if (Math.abs(expectedAmount - Number(total_amount)) > 0.01) return res.status(400).json({ error: 'Invalid total amount' });

        const deliverySlot = await findDeliverySlot();
        const assignedDelivery = deliverySlot.found ? {
            deliveryBoyId: deliverySlot.selected.id,
            assignedDeliveryBoyId: deliverySlot.selected.id,
            assignedDeliveryBoyEmail: deliverySlot.selected.email,
            assignedDeliveryBoyName: deliverySlot.selected.name,
            estimatedDeliveryDate: deliverySlot.estimatedDateIso,
            estimatedDeliveryDateKey: deliverySlot.estimatedDateKey,
            deliveryStatus: 'assigned',
        } : {
            deliveryBoyId: null,
            assignedDeliveryBoyId: null,
            assignedDeliveryBoyEmail: null,
            assignedDeliveryBoyName: null,
            estimatedDeliveryDate: null,
            estimatedDeliveryDateKey: null,
            deliveryStatus: 'pending_assignment',
        };
        const sellerEmails = Array.from(new Set(normalizedItems
            .map((item) => String(item.seller_email || '').trim().toLowerCase())
            .filter(Boolean)));

        const batch = admin.firestore().batch();
        for (const item of normalizedItems) {
            const productRef = admin.firestore().collection('products').doc(item.product_id);
            const productSnap = await productRef.get();
            if (!productSnap.exists) return res.status(400).json({ error: \`Product not found: \${item.title}\` });
            const productData = productSnap.data();
            const currentStock = Number(productData?.stock || 0);
            if (currentStock < item.quantity) return res.status(400).json({ error: \`Insufficient stock for \${item.title}\` });
            batch.update(productRef, { stock: currentStock - item.quantity });

            if (item.cart_item_id) {
                batch.delete(admin.firestore().collection('cartItems').doc(item.cart_item_id));
            }
        }

        const orderRef = admin.firestore().collection('orders').doc();
        batch.set(orderRef, {
            buyer_uid: req.user.uid,
            buyer_email: req.user.email,
            buyer_name: buyer_name || req.user.email,
            items: normalizedItems.map(({ cart_item_id, ...rest }) => rest),
            seller_emails: sellerEmails,
            total_amount: expectedAmount,
            status: 'confirmed',
            shipping_address,
            payment_method,
            payment_status: payment_status || (payment_method === 'COD' ? 'pending' : 'paid'),
            delivery_estimate: assignedDelivery.estimatedDeliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            ...assignedDelivery,
            created_date: admin.firestore.FieldValue.serverTimestamp(),
        });

        if (deliverySlot.found) {
            const addrObj = shipping_address || {};
            const assignmentRef = admin.firestore().collection('deliveryAssignments').doc();
            batch.set(assignmentRef, {
                order_id: orderRef.id,
                delivery_boy_id: deliverySlot.selected.id,
                delivery_boy_email: deliverySlot.selected.email,
                delivery_boy_name: deliverySlot.selected.name,
                buyer_uid: req.user.uid,
                buyer_name: buyer_name || req.user.email,
                buyer_email: req.user.email,
                buyer_phone: String(addrObj.phone || ''),
                delivery_address: \`\${addrObj.address || ''}, \${addrObj.city || ''}, \${addrObj.state || ''} - \${addrObj.pincode || ''}\`,
                items_summary: normalizedItems.map(i => \`\${i.title} x\${i.quantity}\`).join(', '),
                total_amount: expectedAmount,
                payment_method,
                status: 'assigned',
                cod_collected: false,
                estimated_delivery_date: deliverySlot.estimatedDateIso,
                estimated_delivery_date_key: deliverySlot.estimatedDateKey,
                created_date: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        await batch.commit();
        const finalizedOrder = {
            id: orderRef.id,
            buyer_uid: req.user.uid,
            buyer_email: req.user.email,
            buyer_name: buyer_name || req.user.email,
            items: normalizedItems.map(({ cart_item_id, ...rest }) => rest),
            seller_emails: sellerEmails,
            total_amount: expectedAmount,
            shipping_address,
            payment_method,
            payment_status: payment_status || (payment_method === 'COD' ? 'pending' : 'paid'),
            delivery_estimate: assignedDelivery.estimatedDeliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            ...assignedDelivery,
            created_at_iso: new Date().toISOString(),
        };

        await emailNotifier.notifyOrderPlaced({ order: finalizedOrder });
        await emailNotifier.notifyPaymentConfirmed({ order: finalizedOrder });

        res.json({
            success: true,
            id: orderRef.id,
            assignment: {
                deliveryStatus: assignedDelivery.deliveryStatus,
                deliveryBoyId: assignedDelivery.deliveryBoyId,
                assignedDeliveryBoyId: assignedDelivery.assignedDeliveryBoyId,
                assignedDeliveryBoyEmail: assignedDelivery.assignedDeliveryBoyEmail,
                estimatedDeliveryDate: assignedDelivery.estimatedDeliveryDate,
            },
        });
    } catch (error) {
        logError('Order finalize error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/orders/:orderId/status', verifyAuth, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body || {};
        const normalizedStatus = String(status || '').trim().toLowerCase();
        const allowed = new Set(['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']);
        if (!allowed.has(normalizedStatus)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const userRef = await admin.firestore().collection('users').doc(req.user.uid).get();
        const role = String(userRef.data()?.role || 'user');
        if (!['admin', 'delivery_boy', 'seller'].includes(role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const orderRef = admin.firestore().collection('orders').doc(orderId);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) return res.status(404).json({ error: 'Order not found' });

        const order = { id: orderSnap.id, ...orderSnap.data() };
        if (role === 'delivery_boy' && String(order.assignedDeliveryBoyId || '') !== req.user.uid) {
            return res.status(403).json({ error: 'Forbidden for this order' });
        }
        if (role === 'seller') {
            const sellerEmail = String(req.user.email || '').toLowerCase();
            const hasOwnedItems = Array.isArray(order.items) && order.items.some((x) => String(x.seller_email || '').toLowerCase() === sellerEmail);
            if (!hasOwnedItems) return res.status(403).json({ error: 'Forbidden for this order' });
        }

        await orderRef.update({
            status: normalizedStatus,
            updated_date: admin.firestore.FieldValue.serverTimestamp(),
        });

        await emailNotifier.notifyOrderStatusUpdated({ order, status: normalizedStatus });
        res.json({ success: true, orderId, status: normalizedStatus });
    } catch (error) {
        logError('Order status update error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/orders/:orderId/delivery-assigned', verifyAuth, async (req, res) => {
    try {
        const { orderId } = req.params;
        const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
        const role = String(userDoc.data()?.role || 'user');
        if (role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const [orderSnap, assignmentSnap] = await Promise.all([
            admin.firestore().collection('orders').doc(orderId).get(),
            admin.firestore().collection('deliveryAssignments').where('order_id', '==', orderId).limit(1).get(),
        ]);

        if (!orderSnap.exists) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (assignmentSnap.empty) {
            return res.status(404).json({ error: 'Delivery assignment not found' });
        }

        const order = { id: orderSnap.id, ...orderSnap.data() };
        const assignmentDoc = assignmentSnap.docs[0];
        const assignment = { id: assignmentDoc.id, ...assignmentDoc.data() };

        await emailNotifier.notifyDeliveryAssigned({ order, assignment });
        res.json({ success: true, orderId, assignmentId: assignment.id });
    } catch (error) {
        logError('Delivery assignment email error:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- Stripe Checkout Session ---
app.post('/api/stripe/create-checkout-session', verifyAuth, async (req, res) => {
    try {
        const { amount, items } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Invalid cart items' });
        }

        const normalizedItems = items.map((item) => {
            const price = Number(item.price);
            const quantity = Number(item.quantity);
            const name = String(item.name || '').trim();
            const description = String(item.description || '').trim();

            if (!name || !Number.isFinite(price) || price <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
                throw new Error('Invalid cart item payload');
            }

            return { name, description, price, quantity };
        });

        const subtotal = normalizedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 500 ? 0 : 49;
        const expectedAmount = Number((subtotal + shipping).toFixed(2));
        const incomingAmount = Number(amount);

        if (!Number.isFinite(incomingAmount) || Math.abs(expectedAmount - incomingAmount) > 0.01) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const lineItems = normalizedItems.map((item) => {
            const productData = { name: item.name };
            if (item.description) {
                productData.description = item.description;
            }
            return {
                price_data: {
                    currency: 'inr',
                    product_data: productData,
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity,
            };
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'upi'],
            line_items: lineItems,
            mode: 'payment',
            success_url: \`\${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}\`,
            cancel_url: \`\${clientUrl}/cancel\`,
            metadata: {
                userId: req.user.uid,
                email: req.user.email
            },
        });

        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        logError('Stripe Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Only start the HTTP server when this file is executed directly.
// When imported (for serverless/Vercel), we export the \`app\` and let the platform invoke it.
if (fileURLToPath(import.meta.url) === process.argv[1]) {
    app.listen(port, () => {
        logInfo(\`Server running on port \${port}\`);
    });
}
*/