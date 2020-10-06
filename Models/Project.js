const mongoose = require('mongoose')

const ProjectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  title: {
    type: String,
    required: true
  },
  sdgs: [{
    type: String,
    required: true
  }],
  overview: {
    type: String,
    required: true
  },
  tasks: [
    {
      title: {
        type: String,
        required: true
      },
      desc: {
        type: String,
        required: true
      },
      dateStart: {
        type: Date,
        required: true
      },
      dateEnd: {
        type: Date,
        required: true
      },
      isFinished: {
        type: Boolean,
        default: null
      }
    }
  ],
  budget: [
    {
      tool: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        default: 0,
        required: true
      },
      price: {
        type: Number,
        default: 0,
        required: true
      },
      isAvailable: {
        type: Boolean,
        default: true
      }
    }
  ],
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  },
  totalBudget: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Project = mongoose.model('project', ProjectSchema)
module.exports = Project
