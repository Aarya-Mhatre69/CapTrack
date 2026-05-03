const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  status: {
    type: String,
    enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
    default: 'TODO',
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM',
  },
  assignedTo: { type: String, default: '', trim: true },
  createdByName: { type: String, required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
