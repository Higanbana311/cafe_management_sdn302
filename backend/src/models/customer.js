const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        memberPoint: { type: Number, default: 0, min: 0 },
        tier: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
        status: { type: String, required: true, trim: true }
    },
    { collection: 'customers' }
);

module.exports = mongoose.model('Customer', customerSchema);
