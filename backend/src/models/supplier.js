const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        address: { type: String, required: true, trim: true },
        status: { type: String, required: true, trim: true }
    },
    { collection: 'suppliers' }
);

module.exports = mongoose.model('Supplier', supplierSchema);
