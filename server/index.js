import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const isProduction = process.env.NODE_ENV === 'production';
const logInfo = (...args) => {
    if (!isProduction) console.log(...args);
};
const logError = (...args) => {
    if (!isProduction) console.error(...args);
};
const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
    origin: [clientUrl],
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.json());

// Basic health check route
app.get('/', (req, res) => {
    res.send('OmniShop Secure Backend is running!');
});

// 1. STRIPE PAYMENT INTENT ROUTE
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, receipt_email } = req.body;
        
        // Stripe expects amounts in cents/smallest currency unit (e.g., 1000 = $10.00 or ₹10.00)
        // Ensure amount is an integer
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'inr', // Change to 'usd' if needed
            receipt_email: receipt_email,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        logError('Stripe Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 2. NODEMAILER EMAIL/OTP ROUTE
// You can use a free Gmail account (with App Password) or a free SendGrid/Brevo SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS, // Gmail App Password
    },
});

app.post('/send-email', async (req, res) => {
    try {
        const { to, subject, text, html } = req.body;

        const info = await transporter.sendMail({
            from: `"OmniShop Support" <${process.env.SMTP_USER}>`, 
            to,
            subject,
            text,
            html,
        });

        res.json({ success: true, messageId: info.messageId });
    } catch (error) {
        logError('Email Error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logInfo(`Server listening securely on port ${PORT}`);
});
