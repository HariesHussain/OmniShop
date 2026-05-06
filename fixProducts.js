import 'dotenv/config';
import admin from 'firebase-admin';

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const imagesByCategory = {
    "Electronics": ["https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500", "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500"],
    "Clothing": ["https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=500", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500", "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=500"],
    "Books": ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500", "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500"],
    "Home & Kitchen": ["https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500", "https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=500"],
    "Sports": ["https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500", "https://images.unsplash.com/photo-1518611082531-15b5cd93d395?w=500"],
    "Beauty": ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500", "https://images.unsplash.com/photo-1596462502278-27bf85033c5a?w=500"],
    "Toys": ["https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500"],
    "Automotive": ["https://images.unsplash.com/photo-1600706432502-77a0e2e32729?w=500"],
    "Grocery": ["https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"]
};

async function fixImages() {
    const snapshot = await db.collection("products").get();
    const batch = db.batch();
    let count = 0;
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.images && data.images[0] === "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80") {
            const categoryImages = imagesByCategory[data.category] || imagesByCategory["Electronics"];
            const randomImage = categoryImages[Math.floor(Math.random() * categoryImages.length)];
            batch.update(doc.ref, { images: [randomImage] });
            count++;
        }
    });

    if (count > 0) {
        await batch.commit();
        console.log(`Updated ${count} products with dynamic images.`);
    } else {
        console.log("No products needed image updates.");
    }
}

fixImages().then(() => process.exit(0)).catch(console.error);
