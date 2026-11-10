const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
    {
        reservationCode: { type: String, required: true, trim: true },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: true
        },
        tableId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Table',
            required: true
        },
        reservationDate: { type: Date, required: true },
        guestCount: { type: Number, required: true, min: 1 },
        note: { type: String, default: '', trim: true },
        status: { type: String, required: true, trim: true }
    },
    { collection: 'reservations' }
);

module.exports = mongoose.model('Reservation', reservationSchema);
