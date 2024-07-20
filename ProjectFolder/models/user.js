const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const bcrypt = require('bcryptjs');

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
  profilePicture: { type: String, default: ''},
  description: { type: String, default: '' },
  reservations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' }],
  rememberToken: { type: String, default: '' }, //FOR REMEMBER ME FEATURE!
  rememberTokenExpiry: { type: Date, default: null } //FOR REMEMBER ME FEATURE!
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

userSchema.pre('save', async function (next) {
  if (this.isModified('password') || this.isNew) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

userSchema.methods.verifyPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.models.User || new mongoose.model("User", userSchema);

module.exports = User;
