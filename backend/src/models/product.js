const mongoose = require('mongoose');

const recipeIngredientSchema = new mongoose.Schema(
    {
        ingredientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ingredient',
            required: true
        },
        quantity: { type: Number, required: true, min: 0 },
        unit: { type: String, required: true, trim: true }
    },
    { _id: false }
);

const recipeSchema = new mongoose.Schema(
    {
        ingredients: { type: [recipeIngredientSchema], default: [] },
        instructions: { type: String, default: '', trim: true }
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true
        },
        price: { type: Number, required: true, min: 0 },
        unit: { type: String, required: true, trim: true },
        isAvailable: { type: Boolean, default: true },
        recipe: { type: recipeSchema, required: true }
    },
    { collection: 'products' }
);

module.exports = mongoose.model('Product', productSchema);
