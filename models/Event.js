const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Technical', 'Cultural', 'Sports', 'Workshop', 'Other'],
      default: 'Other'
    },
    club: { type: String, trim: true, default: 'General' },
    venue: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    capacity: { type: Number, default: 100, min: 1 },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

eventSchema.index({ date: 1 });
eventSchema.index({ title: 'text', description: 'text', club: 'text' });

module.exports = mongoose.model('Event', eventSchema);
