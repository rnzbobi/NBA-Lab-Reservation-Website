const mongoose = require('mongoose');

const stadiumSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  totalSeats: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  reservations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' }]
});

module.exports = mongoose.model('Stadium', stadiumSchema, 'stadiums');
