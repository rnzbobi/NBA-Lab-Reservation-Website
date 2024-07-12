const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  stadium: { type: mongoose.Schema.Types.ObjectId, ref: 'Stadium', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Made optional
  seatNumber: [{ type: String, required: true }], // Changed to Array of Strings
  reservedAt: { type: Date, required: true },
  reservationStart: { type: Date, required: true },
  reservationEnd: { type: Date, required: true },
  anonymous: { type: Boolean, default: false },
  removed: { type: Boolean, default: false } // Added removed field
});

module.exports = mongoose.model('Reservation', reservationSchema);
