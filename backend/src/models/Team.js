const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamUniqueId: { type: String, required: true, unique: true },
  teamPassword: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  leader: {
    name: { type: String, required: true },
    rollNumber: { type: String, default: '' },
    cgpi: { type: Number, min: 0, max: 10, default: 0 },
    department: { type: String, default: '' },
    division: { type: String, default: '' },
  },
  members: [{
    name: { type: String, required: true },
    rollNumber: { type: String, default: '' },
    cgpi: { type: Number, min: 0, max: 10, default: 0 },
    division: { type: String, default: '' },
  }],
  projectTitle: String,
  projectDescription: String,
  // type replaces the old 'remark' field for Internal/External classification
  type: {
    type: String,
    enum: ['Internal', 'External'],
    default: 'Internal',
  },
  // kept for backward compat — mirrors 'type'
  remark: { type: String, default: 'Internal' },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  requestedMentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: {
    type: String,
    enum: ['PENDING', 'MENTOR_APPROVED', 'ACTIVE', 'REJECTED'],
    default: 'PENDING',
  },
  rejectionReason: { type: String, default: null },
  mentorApprovedAt: { type: Date, default: null },
  coordinatorActivatedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
