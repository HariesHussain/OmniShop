export const Notification = {
    name: "Notification",
    type: "object",
    properties: {
        user_email: {
            type: "string"
        },
        title: {
            type: "string"
        },
        message: {
            type: "string"
        },
        type: {
            type: "string",
            enum: [
                "offer",
                "order",
                "system",
                "promo"
            ]
        },
        is_read: {
            type: "boolean"
        },
        is_broadcast: {
            type: "boolean"
        },
        link: {
            type: "string"
        }
    },
    required: [
        "title",
        "message",
        "type"
    ]
};