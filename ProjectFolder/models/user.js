const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^[a-zA-Z0-9._%+-]+@dlsu\.edu\.ph$/, 'Please fill a valid DLSU email address']
  },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'lab_technician'], required: true },
  name: { type: String, required: true },
  profilePicture: { type: String, default: '' },
  description: { type: String, default: '' },
  reservations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' }],
  rememberToken: { type: String, default: '' }, //FOR REMEMBER ME FEATURE!
  rememberTokenExpiry: { type: Date, default: null } //FOR REMEMBER ME FEATURE!
});

module.exports = mongoose.model('User', userSchema);
