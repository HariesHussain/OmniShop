export const Product = {
    name: "Product",
    type: "object",
    properties: {
        title: {
            type: "string"
        },
        description: {
            type: "string"
        },
        price: {
            type: "number"
        },
        original_price: {
            type: "number"
        },
        category: {
            type: "string",
            enum: [
                "Electronics",
                "Clothing",
                "Books",
                "Home & Kitchen",
                "Sports",
                "Beauty",
                "Toys",
                "Automotive",
                "Grocery",
                "Other"
            ]
        },
        brand: {
            type: "string"
        },
        images: {
            type: "array",
            items: {
                type: "string"
            }
        },
        stock: {
            type: "number"
        },
        seller_email: {
            type: "string"
        },
        seller_name: {
            type: "string"
        },
        rating: {
            type: "number"
        },
        review_count: {
            type: "number"
        },
        tags: {
            type: "array",
            items: {
                type: "string"
            }
        },
        is_active: {
            type: "boolean"
        },
        is_featured: {
            type: "boolean"
        }
    },
    required: [
        "title",
        "price",
        "category"
    ]
};