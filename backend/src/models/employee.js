const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, trim: true },
        passwordHash: { type: String, required: true },
        isActive: { type: Boolean, default: true }
    },
    { _id: false }
);

const employeeSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        role: { type: String, required: true, trim: true },
        permissions: [{ type: String, trim: true }],
        account: { type: accountSchema, default: null },
        salary: { type: Number, required: true, min: 0 },
        hireDate: { type: Date, required: true },
        status: { type: String, required: true, trim: true }
    },
    { collection: 'employees' }
);

module.exports = mongoose.model('Employee', employeeSchema);
