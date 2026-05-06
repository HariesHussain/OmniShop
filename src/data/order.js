export const Order = {
    name: "Order",
    type: "object",
    properties: {
        buyer_email: {
            type: "string"
        },
        buyer_name: {
            type: "string"
        },
        items: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    product_id: {
                        type: "string"
                    },
                    title: {
                        type: "string"
                    },
                    price: {
                        type: "number"
                    },
                    quantity: {
                        type: "number"
                    },
                    image: {
                        type: "string"
                    },
                    seller_email: {
                        type: "string"
                    }
                }
            }
        },
        total_amount: {
            type: "number"
        },
        status: {
            type: "string",
            enum: [
                "pending",
                "confirmed",
                "shipped",
                "delivered",
                "cancelled"
            ]
        },
        shipping_address: {
            type: "object",
            properties: {
                name: {
                    type: "string"
                },
                phone: {
                    type: "string"
                },
                address: {
                    type: "string"
                },
                city: {
                    type: "string"
                },
                state: {
                    type: "string"
                },
                pincode: {
                    type: "string"
                }
            }
        },
        payment_method: {
            type: "string",
            enum: [
                "COD",
                "Card",
                "UPI",
                "Net Banking"
            ]
        },
        payment_status: {
            type: "string",
            enum: [
                "pending",
                "paid",
                "failed",
                "refunded"
            ]
        }
    },
    required: [
        "buyer_email",
        "items",
        "total_amount",
        "status"
    ]
};