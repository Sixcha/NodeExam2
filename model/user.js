const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

mongoose.connect(process.env.DB_URL).then(() => {
  console.log("Connected to DB")
});

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

userSchema.pre('save', function(next) {
  if (this.isModified('password') || this.isNew) {
    const secret = process.env.SECRET_KEY;
    const hash = crypto.createHmac('sha256', secret)
                       .update(this.password)
                       .digest('hex');
    this.password = hash;
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;