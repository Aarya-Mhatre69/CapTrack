const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  milestoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone', default: null },
  title: { type: String, required: true },
  description: String,
  files: [{
    filename: String,
    storedName: String,
    path: String,
    mimetype: String,
    size: Number,
  }],
  version: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);
