const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  priority: {
    type: String,
    enum: ['NORMAL', 'HIGH', 'BROADCAST'],
    default: 'NORMAL',
  },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
