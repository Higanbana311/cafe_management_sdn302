const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        category: { type: String, required: true, trim: true },
        unit: { type: String, required: true, trim: true },
        stock: { type: Number, required: true, min: 0 },
        minStock: { type: Number, required: true, min: 0 },
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
            required: true
        },
        lastUpdated: { type: Date, default: Date.now }
    },
    { collection: 'ingredients' }
);

module.exports = mongoose.model('Ingredient', ingredientSchema);
