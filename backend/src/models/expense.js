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
        paymentMethod: { type: String, required: true, trim: true }
    },
    { collection: 'expenses' }
);

module.exports = mongoose.model('Expense', expenseSchema);
