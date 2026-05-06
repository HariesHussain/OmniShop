export const SellerApplication = {
    name: "SellerApplication",
    type: "object",
    properties: {
        applicant_email: {
            type: "string"
        },
        applicant_name: {
            type: "string"
        },
        business_name: {
            type: "string"
        },
        business_type: {
            type: "string"
        },
        description: {
            type: "string"
        },
        phone: {
            type: "string"
        },
        gst_number: {
            type: "string"
        },
        address: {
            type: "string"
        },
        status: {
            type: "string",
            enum: [
                "pending",
                "approved",
                "rejected"
            ]
        },
        admin_note: {
            type: "string"
        }
    },
    required: [
        "applicant_email",
        "business_name",
        "description"
    ]
};