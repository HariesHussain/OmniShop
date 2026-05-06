export const CartItem = {
    name: "CartItem",
    type: "object",
    properties: {
        user_email: {
            type: "string"
        },
        product_id: {
            type: "string"
        },
        title: {
            type: "string"
        },
        price: {
            type: "number"
        },
        image: {
            type: "string"
        },
        quantity: {
            type: "number"
        },
        seller_email: {
            type: "string"
        }
    },
    required: [
        "user_email",
        "product_id",
        "quantity"
    ]
};