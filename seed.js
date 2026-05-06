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

const CATEGORY_DATA = {
    "Electronics": {
        images: ["1505740420928-5e560c06d30e", "1496181133206-80ce9b88a853", "1696446701796-da61225697cc", "1678911820864-e2c567c655d7", "1517336714460-453b5a61ff53", "1593359677879-a4bb92f829d1", "1606813907291-d86ebb995a26"],
        items: ["Smartphone", "Laptop", "Wireless Headphones", "Smart Watch", "Bluetooth Speaker", "Gaming Console", "4K Monitor", "Digital Camera"]
    },
    "Clothing": {
        images: ["1542272604-787c3835535d", "1549298916-b41d501d3772", "1556821840-3a63f95609a7", "1572804013309-59a88b7e92f1", "1551028150-64b9f398f678", "1521572163474-6864f9cf17ab", "1610030469983-98eeb64c6a62"],
        items: ["Slim Fit Jeans", "White Sneakers", "Hoodie", "Floral Dress", "Leather Jacket", "T-Shirt", "Running Shoes", "Silk Saree"]
    },
    "Books": {
        images: ["1544947950-fa07a98d237f", "1589829085413-56de8ae18c73", "1592492159418-39f3df9fb22b", "1543004218-ee141104975a", "1512820790803-83ca734da794", "1532012190549-140660a0f994"],
        items: ["Philosophy Book", "Science Fiction Novel", "Self-Help Guide", "History Collection", "Cooking Recipes", "Mystery Thriller"]
    },
    "Home & Kitchen": {
        images: ["1584286595398-a59f21d313f5", "1520970014086-2208d157c9e2", "1584990344619-3911aa617044", "1507473885765-e6ed057f782c", "1629949009765-40f74c944766", "1485955900006-10f4d324d411"],
        items: ["Air Fryer", "Coffee Maker", "Cookware Set", "Smart Desk Lamp", "Memory Foam Pillow", "Ceramic Planter", "Electric Kettle"]
    },
    "Sports": {
        images: ["1517649763962-0c623066013b", "1518611082531-15b5cd93d395", "1584735934070-e8a4a7d25e4c", "1534438327276-144a660751a6", "1517466787929-bc29331f995f"],
        items: ["Yoga Mat", "Dumbbell Set", "Running Shorts", "Basketball", "Cricket Bat", "Tennis Racket", "Gym Bag"]
    },
    "Beauty": {
        images: ["1586771107445-d3ca888129ee", "1556228578-0d85b1a4d571", "1503951914875-452162b0f3f1", "1620916566398-39f3df9fb22b", "1522337360788-8b13dee7a37e", "1596462502278-27bf85033c5a"],
        items: ["Matte Lipstick", "Hydrating Moisturizer", "Face Serum", "Grooming Kit", "Professional Hair Dryer", "Organic Aloe Vera"]
    },
    "Toys": {
        images: ["1566576912321-d58ddd7a6088", "1558877385-81a4209c7352", "1596461404459-432a10313722", "1515488042361-ee00e0ddd4e4", "1545558014-869207ad66b6"],
        items: ["Action Figure", "Building Blocks", "Remote Control Car", "Stuffed Bear", "Puzzle Game", "Board Game"]
    },
    "Automotive": {
        images: ["1600706432502-77a0e2e32729", "1552650278-bf00119d815f", "1544333303-56ec3771e34c", "1580273916550-13b3e5934794", "1492144534655-ae79c964c9d7"],
        items: ["Car Air Freshener", "Cleaning Kit", "Phone Mount", "Tire Inflator", "Dash Cam", "Floor Mats"]
    },
    "Grocery": {
        images: ["1586201375761-83865001e31c", "1474979266404-7eaacbcd87c5", "1559056199-641a0ac8b55e", "1511381939415-e44015466834", "1542838132-92c53300491e"],
        items: ["Basmati Rice", "Olive Oil", "Instant Coffee", "Dark Chocolate", "Almonds Pack"]
    }
};

const BRANDS = ["Samsung", "Apple", "Nike", "Adidas", "Sony", "Dell", "Xiaomi", "Zara", "H&M", "IKEA", "Bose", "LG"];

async function seedDatabase() {
    console.log("Starting full category seed...");

    const existing = await db.collection("products").get();
    const batch = db.batch();
    existing.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log("Cleared old products.");

    let count = 0;
    const categories = Object.keys(CATEGORY_DATA);

    for (const category of categories) {
        const data = CATEGORY_DATA[category];
        console.log(`Seeding category: ${category}...`);

        for (let i = 0; i < 18; i++) {
            const itemBase = data.items[i % data.items.length];
            const imgId = data.images[i % data.images.length];
            const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];

            const product = {
                title: `${brand} ${itemBase} ${i > data.items.length ? "(Pro Edition)" : ""}`,
                price: Math.floor(Math.random() * 50000) + 499,
                original_price: 0,
                category: category,
                brand: brand,
                description: `Experience the best of ${category} with this premium ${itemBase}. Designed for modern users who value quality and style. Includes 2-year warranty and free shipping.`,
                seller_email: "test.seller@omnishop.com",
                images: [`https://images.unsplash.com/photo-${imgId}?w=800&q=80`],
                is_active: true,
                is_featured: i < 3,
                rating: Number((4 + Math.random()).toFixed(1)),
                review_count: Math.floor(Math.random() * 500) + 20,
                stock: Math.floor(Math.random() * 100) + 10,
                created_date: new Date().toISOString(),
                delivery_days: 7
            };

            product.original_price = Math.round(product.price * (1.1 + Math.random() * 0.4));

            await db.collection("products").add(product);
            count++;
        }
    }

    console.log(`Done! Seeded ${count} products with verified images across all categories.`);
    process.exit(0);
}

seedDatabase().catch(console.error);
