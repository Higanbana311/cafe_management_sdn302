const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, trim: true, uppercase: true },
        description: { type: String, default: '', trim: true },
        discountType: { type: String, required: true, trim: true },
        discountValue: { type: Number, required: true, min: 0 },
        minOrderAmount: { type: Number, default: 0, min: 0 },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        isActive: { type: Boolean, default: true }
    },
    { collection: 'promotions', timestamps: true }
);

module.exports = mongoose.model('Promotion', promotionSchema);
