const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
    {
        expenseCode: { type: String, required: true, trim: true },
        category: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0 },
        expenseDate: { type: Date, required: true },
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true
        },
        paymentMethod: { type: String, required: true, trim: true },
        // Set when this expense was auto-generated from a paid purchase order
        // (see purchaseOrder controller's syncExpenseForPurchaseOrder), so it can
        // be found again, updated or removed as that order's payment status changes.
        purchaseOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PurchaseOrder',
            default: null
        }
    },
    { collection: 'expenses' }
);

module.exports = mongoose.model('Expense', expenseSchema);
