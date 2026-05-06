export const Review = {
    name: "Review",
    type: "object",
    properties: {
        product_id: {
            type: "string"
        },
        reviewer_email: {
            type: "string"
        },
        reviewer_name: {
            type: "string"
        },
        rating: {
            type: "number"
        },
        title: {
            type: "string"
        },
        comment: {
            type: "string"
        },
        verified_purchase: {
            type: "boolean"
        }
    },
    required: [
        "product_id",
        "rating",
        "comment"
    ]
};