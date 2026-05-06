import {
    collection,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where,
    orderBy,
    limit,
    doc,
    serverTimestamp,
    writeBatch,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

// ============= PRODUCTS =============
export const getProducts = async (limitNum = null) => {
    try {
        let q = query(
            collection(db, 'products'),
            orderBy('created_date', 'desc')
        );
        if (limitNum) {
            q = query(
                collection(db, 'products'),
                orderBy('created_date', 'desc'),
                limit(limitNum)
            );
        }
        const snapshot = await getDocs(q);
        const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return allProducts.filter(p => p.is_active === true);
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

export const getProduct = async (id) => {
    try {
        const docRef = doc(db, 'products', id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() };
        }
        throw new Error('Product not found');
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
};

export const getProductsByFilter = async (field, value) => {
    try {
        const q = query(
            collection(db, 'products'),
            where(field, '==', value),
            where('is_active', '==', true)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching products by filter:', error);
        throw error;
    }
};

export const createProduct = async (data) => {
    try {
        const docRef = await addDoc(collection(db, 'products'), {
            ...data,
            is_active: data.is_active !== false,
            created_date: serverTimestamp(),
        });
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
};

export const updateProduct = async (id, data) => {
    try {
        const docRef = doc(db, 'products', id);
        await updateDoc(docRef, data);
        return { id, ...data };
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
};

export const deleteProduct = async (id) => {
    try {
        const docRef = doc(db, 'products', id);
        await deleteDoc(docRef);
        return id;
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};

export const listProducts = async (limitNum = 300) => {
    try {
        const q = query(
            collection(db, 'products'),
            orderBy('created_date', 'desc'),
            limit(limitNum)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error listing products:', error);
        throw error;
    }
};

// ============= CART ITEMS =============
export const getCartItems = async (userEmail) => {
    try {
        const q = query(
            collection(db, 'cartItems'),
            where('user_email', '==', userEmail)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching cart items:', error);
        throw error;
    }
};

export const getCartItem = async (userEmail, productId) => {
    try {
        const q = query(
            collection(db, 'cartItems'),
            where('user_email', '==', userEmail),
            where('product_id', '==', productId)
        );
        const snapshot = await getDocs(q);
        if (snapshot.docs.length > 0) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error fetching cart item:', error);
        throw error;
    }
};

export const addCartItem = async (data) => {
    try {
        const docRef = await addDoc(collection(db, 'cartItems'), {
            ...data,
            created_date: serverTimestamp(),
        });
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error('Error adding cart item:', error);
        throw error;
    }
};

export const updateCartItem = async (id, data) => {
    try {
        const docRef = doc(db, 'cartItems', id);
        await updateDoc(docRef, data);
        return { id, ...data };
    } catch (error) {
        console.error('Error updating cart item:', error);
        throw error;
    }
};

export const deleteCartItem = async (id) => {
    try {
        const docRef = doc(db, 'cartItems', id);
        await deleteDoc(docRef);
        return id;
    } catch (error) {
        console.error('Error deleting cart item:', error);
        throw error;
    }
};

export const clearUserCart = async (userEmail) => {
    try {
        const q = query(
            collection(db, 'cartItems'),
            where('user_email', '==', userEmail)
        );
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        return true;
    } catch (error) {
        console.error('Error clearing cart:', error);
        throw error;
    }
};

// --- Helper for Client-side Sorting ---
const sortByDate = (data) => {
    return [...data].sort((a, b) => {
        const dateA = a.created_date?.toMillis ? a.created_date.toMillis() : new Date(a.created_date || 0).getTime();
        const dateB = b.created_date?.toMillis ? b.created_date.toMillis() : new Date(b.created_date || 0).getTime();
        return dateB - dateA;
    });
};

// ============= ORDERS =============
export const getOrders = async (buyerEmail, limitNum = null) => {
    try {
        let q = query(
            collection(db, 'orders'),
            where('buyer_email', '==', buyerEmail)
        );
        const snapshot = await getDocs(q);
        let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        results = sortByDate(results);
        if (limitNum) results = results.slice(0, limitNum);
        return results;
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};

export const getOrdersBySeller = async (sellerEmail) => {
    try {
        // Fetch all orders and filter by seller email in items
        // In a production app, you'd denormalize this or use a collection group
        const q = query(collection(db, 'orders'));
        const snapshot = await getDocs(q);
        const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const sellerOrders = allOrders.filter(order => 
            order.items && order.items.some(item => item.seller_email === sellerEmail)
        );
        
        return sortByDate(sellerOrders);
    } catch (error) {
        console.error('Error fetching seller orders:', error);
        throw error;
    }
};

export const getProductsBySeller = async (sellerEmail) => {
    try {
        const q = query(
            collection(db, 'products'),
            where('seller_email', '==', sellerEmail)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching seller products:', error);
        throw error;
    }
};

export const getOrder = async (id) => {
    try {
        const docRef = doc(db, 'orders', id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() };
        }
        throw new Error('Order not found');
    } catch (error) {
        console.error('Error fetching order:', error);
        throw error;
    }
};

export const createOrder = async (data) => {
    try {
        const docRef = await addDoc(collection(db, 'orders'), {
            ...data,
            created_date: serverTimestamp(),
        });
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

export const updateOrder = async (id, data) => {
    try {
        const docRef = doc(db, 'orders', id);
        await updateDoc(docRef, data);
        return { id, ...data };
    } catch (error) {
        console.error('Error updating order:', error);
        throw error;
    }
};

export const listOrders = async (limitNum = 100) => {
    try {
        const q = query(
            collection(db, 'orders'),
            limit(limitNum)
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return sortByDate(results);
    } catch (error) {
        console.error('Error listing orders:', error);
        throw error;
    }
};

// ============= REVIEWS =============
export const getReviews = async (productId) => {
    try {
        const q = query(
            collection(db, 'reviews'),
            where('product_id', '==', productId)
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return sortByDate(results);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        throw error;
    }
};

export const createReview = async (data) => {
    try {
        const docRef = await addDoc(collection(db, 'reviews'), {
            ...data,
            created_date: serverTimestamp(),
        });
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error('Error creating review:', error);
        throw error;
    }
};

// ============= NOTIFICATIONS =============
export const getNotifications = async (userEmail) => {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('user_email', '==', userEmail)
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return sortByDate(results);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

export const getBroadcastNotifications = async () => {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('is_broadcast', '==', true)
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return sortByDate(results);
    } catch (error) {
        console.error('Error fetching broadcast notifications:', error);
        throw error;
    }
};

export const deleteReview = async (id) => {
    try {
        await deleteDoc(doc(db, 'reviews', id));
    } catch (error) {
        console.error("Error deleting review:", error);
        throw error;
    }
};

export const createNotification = async (data) => {
    try {
        const docRef = await addDoc(collection(db, 'notifications'), {
            ...data,
            is_read: false,
            created_date: serverTimestamp(),
        });
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

export const updateNotification = async (id, data) => {
    try {
        const docRef = doc(db, 'notifications', id);
        await updateDoc(docRef, data);
        return { id, ...data };
    } catch (error) {
        console.error('Error updating notification:', error);
        throw error;
    }
};

// ============= SELLER APPLICATIONS =============
export const getSellerApps = async (email) => {
    try {
        const q = query(
            collection(db, 'sellerApplications'),
            where('applicant_email', '==', email)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching seller applications:', error);
        throw error;
    }
};

export const createSellerApp = async (data) => {
    try {
        const docRef = await addDoc(collection(db, 'sellerApplications'), {
            ...data,
            status: 'pending',
            created_date: serverTimestamp(),
        });
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error('Error creating seller application:', error);
        throw error;
    }
};

export const updateSellerApp = async (id, data) => {
    try {
        const docRef = doc(db, 'sellerApplications', id);
        await updateDoc(docRef, data);
        return { id, ...data };
    } catch (error) {
        console.error('Error updating seller application:', error);
        throw error;
    }
};

export const listSellerApps = async (limitNum = 100) => {
    try {
        const q = query(
            collection(db, 'sellerApplications'),
            limit(limitNum)
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return sortByDate(results);
    } catch (error) {
        console.error('Error listing seller applications:', error);
        throw error;
    }
};

// ============= DELIVERY APPLICATIONS =============
export const getDeliveryApps = async (email) => {
    try {
        const q = query(
            collection(db, 'deliveryApplications'),
            where('applicant_email', '==', email)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching delivery applications:', error);
        throw error;
    }
};

export const createDeliveryApp = async (data) => {
    try {
        const docRef = await addDoc(collection(db, 'deliveryApplications'), {
            ...data,
            status: 'pending',
            created_date: serverTimestamp(),
        });
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error('Error creating delivery application:', error);
        throw error;
    }
};

export const updateDeliveryApp = async (id, data) => {
    try {
        const docRef = doc(db, 'deliveryApplications', id);
        await updateDoc(docRef, data);
        return { id, ...data };
    } catch (error) {
        console.error('Error updating delivery application:', error);
        throw error;
    }
};

export const listDeliveryApps = async (limitNum = 100) => {
    try {
        const q = query(
            collection(db, 'deliveryApplications'),
            limit(limitNum)
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return sortByDate(results);
    } catch (error) {
        console.error('Error listing delivery applications:', error);
        throw error;
    }
};

// ============= DELIVERY ASSIGNMENTS =============
export const getDeliveryAssignments = async (email) => {
    try {
        const q = query(
            collection(db, 'deliveryAssignments'),
            where('delivery_boy_email', '==', email)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching delivery assignments:', error);
        throw error;
    }
};

export const getDeliveryAssignmentsByOrder = async (orderId) => {
    try {
        const q = query(
            collection(db, 'deliveryAssignments'),
            where('order_id', '==', orderId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching delivery assignments by order:', error);
        throw error;
    }
};

export const createDeliveryAssignment = async (data) => {
    try {
        const docRef = await addDoc(collection(db, 'deliveryAssignments'), {
            ...data,
            status: 'assigned',
            created_date: serverTimestamp(),
        });
        return { id: docRef.id, ...data };
    } catch (error) {
        console.error('Error creating delivery assignment:', error);
        throw error;
    }
};

export const updateDeliveryAssignment = async (id, data) => {
    try {
        const docRef = doc(db, 'deliveryAssignments', id);
        await updateDoc(docRef, data);
        return { id, ...data };
    } catch (error) {
        console.error('Error updating delivery assignment:', error);
        throw error;
    }
};

export const listDeliveryAssignments = async (limitNum = 100) => {
    try {
        const q = query(
            collection(db, 'deliveryAssignments'),
            limit(limitNum)
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return sortByDate(results);
    } catch (error) {
        console.error('Error listing delivery assignments:', error);
        throw error;
    }
};

// ============= USERS =============
export const getUser = async (uid) => {
    try {
        const docRef = doc(db, 'users', uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return { uid: snapshot.id, ...snapshot.data() };
        }
        return null;
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
};

export const getUserByEmail = async (email) => {
    try {
        const q = query(
            collection(db, 'users'),
            where('email', '==', email)
        );
        const snapshot = await getDocs(q);
        if (snapshot.docs.length > 0) {
            const doc = snapshot.docs[0];
            return { id: doc.id, uid: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error fetching user by email:', error);
        throw error;
    }
};

export const createUserProfile = async (uid, data) => {
    try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            await setDoc(docRef, {
                ...data,
                createdAt: serverTimestamp(),
            });
        }
        return { uid, ...data };
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
    }
};

export const updateUserProfile = async (uid, data) => {
    try {
        const docRef = doc(db, 'users', uid);
        await updateDoc(docRef, data);
        return { uid, ...data };
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};

export const updateUserByDocId = async (docId, data) => {
    try {
        const docRef = doc(db, 'users', docId);
        await updateDoc(docRef, data);
        return { id: docId, ...data };
    } catch (error) {
        console.error('Error updating user by doc ID:', error);
        throw error;
    }
};

export const listUsers = async (limitNum = 100) => {
    try {
        const q = query(
            collection(db, 'users'),
            limit(limitNum)
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => ({ id: doc.id, uid: doc.id, ...doc.data() }));
        return sortByDate(results);
    } catch (error) {
        console.error('Error listing users:', error);
        throw error;
    }
};

// ============= UTILITY FUNCTIONS =============
export const getAllDocuments = async (collectionName, limitNum = 100) => {
    try {
        const q = query(collection(db, collectionName), limit(limitNum));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        throw error;
    }
};
