const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        productName: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 }
    },
    { _id: false }
);

const promotionSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, trim: true },
        discountType: { type: String, required: true, trim: true },
        discountValue: { type: Number, required: true, min: 0 }
    },
    { _id: false }
);

const paymentSchema = new mongoose.Schema(
    {
        method: { type: String, default: null, trim: true },
        amount: { type: Number, default: 0, min: 0 },
        paidAt: { type: Date, default: null },
        status: { type: String, required: true, trim: true },
        transactionCode: { type: String, default: null, trim: true }
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        orderCode: { type: String, required: true, trim: true },
        orderType: { type: String, required: true, trim: true },
        tableId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Table',
            required: true
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            default: null
        },
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true
        },
        orderDate: { type: Date, default: Date.now },
        items: { type: [orderItemSchema], required: true },
        subTotal: { type: Number, required: true, min: 0 },
        promotion: { type: promotionSchema, default: null },
        discountAmount: { type: Number, default: 0, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
        orderStatus: { type: String, required: true, trim: true },
        payment: { type: paymentSchema, required: true }
    },
    { collection: 'orders' }
);

module.exports = mongoose.model('Order', orderSchema);
