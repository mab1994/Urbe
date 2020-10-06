const mongoose = require('mongoose')

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  birthdate: {
    type: Date,
    required: true,
    default: Date.now
  },
  bio: {
    type: String
  },
  adress: {
    type: String
  },
  job: {
    type: String,
    required: true
  },
  jobLocation: {
    type: String
  },
  jobGovernorate: {
    type: String
  },
  jobCity: {
    type: String
  },
  skills: {
    type: [String]
  },
  lastDegree: {
    type: String,
    required: true
  },
  lastInstitute: {
    type: String,
    required: true
  },
  curriculum: [
    {
      year: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true
      },
      institute: {
        type: String,
        required: true
      }
    }
  ]
})

const Profile = mongoose.model('profile', ProfileSchema)
module.exports = Profile
