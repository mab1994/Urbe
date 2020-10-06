const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
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
  },
  avatar: {
    type: String
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  tokenExpires: Date
})

const User = mongoose.model('user', UserSchema)
module.exports = User
