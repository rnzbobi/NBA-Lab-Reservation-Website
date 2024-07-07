const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  stadium: { type: mongoose.Schema.Types.ObjectId, ref: 'Stadium', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seatNumber: { type: Number, required: true },
  reservedAt: { type: Date, required: true },
  reservationStart: { type: Date, required: true },
  reservationEnd: { type: Date, required: true },
  anonymous: { type: Boolean, default: false }
});

module.exports = mongoose.model('Reservation', reservationSchema);
