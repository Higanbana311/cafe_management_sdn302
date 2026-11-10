const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
    {
        tableNumber: { type: Number, required: true, min: 1 },
        area: { type: String, required: true, trim: true },
        capacity: { type: Number, required: true, min: 1 },
        status: { type: String, required: true, trim: true }
    },
    { collection: 'tables' }
);

module.exports = mongoose.model('Table', tableSchema);
