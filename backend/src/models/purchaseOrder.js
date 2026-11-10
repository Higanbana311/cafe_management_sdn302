const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema(
    {
        ingredientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ingredient',
            required: true
        },
        name: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 0 },
        unit: { type: String, required: true, trim: true },
        unitPrice: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 }
    },
    { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
    {
        purchaseCode: { type: String, required: true, trim: true },
        supplierId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier',
            required: true
        },
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true
        },
        purchaseDate: { type: Date, default: Date.now },
        items: { type: [purchaseItemSchema], required: true },
        totalAmount: { type: Number, required: true, min: 0 },
        paymentStatus: { type: String, required: true, trim: true },
        status: { type: String, required: true, trim: true }
    },
    { collection: 'purchase_orders' }
);

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
