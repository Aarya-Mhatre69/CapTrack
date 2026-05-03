const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedByName: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  performedByTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  targetType: {
    type: String,
    enum: ['team', 'user', 'milestone', 'submission', 'announcement', 'phase', 'task'],
    default: null,
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
  targetName: { type: String, default: null },
  details: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
