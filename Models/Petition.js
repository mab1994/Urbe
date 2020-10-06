const mongoose = require('mongoose')

const PetitionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  subject: {
    type: String,
    required: true
  },
  categories: [{
    type: String,
    required: true
  }],
  content: {
    type: String,
    required: true
  },
  name: {
    type: String
  },
  avatar: {
    type: String
  },
  supports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    firstName: {
      type: String
    },
    lastName: {
      type: String
    },
    avatar: {
      type: String
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    text: {
      type: String,
      required: true
    },
    firstName: {
      type: String
    },
    lastName: {
      type: String
    },
    avatar: {
      type: String
    },
    writtenAt: {
      type: Date,
      default: Date.now
    }
  }],
  writtenAt: {
    type: Date,
    default: Date.now
  }
})

const Petition = mongoose.model('petition', PetitionSchema)
module.exports = Petition
