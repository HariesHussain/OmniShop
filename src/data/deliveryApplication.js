export const DeliveryApplication = {
    name: "DeliveryApplication",
    type: "object",
    properties: {
        applicant_email: {
            type: "string"
        },
        applicant_name: {
            type: "string"
        },
        phone: {
            type: "string"
        },
        vehicle_type: {
            type: "string",
            enum: [
                "Bike",
                "Scooter",
                "Cycle",
                "Car",
                "Van"
            ]
        },
        area: {
            type: "string"
        },
        experience: {
            type: "string"
        },
        id_proof: {
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
        "phone",
        "vehicle_type"
    ]
};