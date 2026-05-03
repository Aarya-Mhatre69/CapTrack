const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  authorType: { type: String, enum: ['team', 'mentor', 'coordinator'], required: true },
  authorName: { type: String, required: true },
  body: { type: String, required: true, maxlength: 2000 },
}, { timestamps: true });

commentSchema.index({ submissionId: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);
