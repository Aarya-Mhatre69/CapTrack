const mongoose = require('mongoose');

const phaseConfigSchema = new mongoose.Schema({
  currentPhase: { type: Number, default: 0, min: 0, max: 3 },
  phases: [
    {
      number: { type: Number },
      name: { type: String },
      description: { type: String },
    },
  ],
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('PhaseConfig', phaseConfigSchema);
