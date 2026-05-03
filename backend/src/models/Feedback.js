const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', default: null },
  milestoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone', default: null },
  comment: { type: String, required: true },
  approved: { type: Boolean, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
