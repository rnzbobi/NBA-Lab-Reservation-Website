const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  stadium: { type: mongoose.Schema.Types.ObjectId, ref: 'Stadium', required: true },
  seatNumber: { type: String, required: true },
  timeSlot: { type: Date, required: true },
  reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', default: null }
});

module.exports = mongoose.model('Slot', slotSchema);
