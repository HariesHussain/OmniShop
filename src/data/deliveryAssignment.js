export const DeliveryAssignment = {
    name: "DeliveryAssignment",
    type: "object",
    properties: {
        order_id: {
            type: "string"
        },
        delivery_boy_email: {
            type: "string"
        },
        delivery_boy_name: {
            type: "string"
        },
        buyer_name: {
            type: "string"
        },
        buyer_phone: {
            type: "string"
        },
        delivery_address: {
            type: "string"
        },
        items_summary: {
            type: "string"
        },
        total_amount: {
            type: "number"
        },
        payment_method: {
            type: "string"
        },
        status: {
            type: "string",
            enum: [
                "assigned",
                "picked_up",
                "out_for_delivery",
                "delivered",
                "failed"
            ]
        },
        cod_collected: {
            type: "boolean"
        },
        notes: {
            type: "string"
        },
        otp: {
            type: "string"
        }
    },
    required: [
        "order_id",
        "delivery_boy_email",
        "status"
    ]
};