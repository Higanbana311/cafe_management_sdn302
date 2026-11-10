const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        status: { type: String, required: true, trim: true }
    },
    { collection: 'categories' }
);

module.exports = mongoose.model('Category', categorySchema);
