const express = require('express');
const Event = require('../models/Event');
const { requireAuth, requireOrganizer } = require('../middleware/auth');

const router = express.Router();

// READ: list with search, category filter and upcoming-only filter
router.get('/', async (req, res) => {
  try {
    const { q, category, upcoming } = req.query;
    const filter = {};
    if (q) filter.$text = { $search: q };
    if (category && category !== 'All') filter.category = category;
    if (upcoming === 'true') filter.date = { $gte: new Date() };
    const events = await Event.find(filter)
      .sort({ date: 1 })
      .populate('organizer', 'name');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch {
    res.status(400).json({ message: 'Invalid event id' });
  }
});

// CREATE
router.post('/', requireAuth, requireOrganizer, async (req, res) => {
  try {
    const { title, description, category, club, venue, date, capacity } = req.body;
    const event = await Event.create({
      title, description, category, club, venue, date, capacity,
      organizer: req.user.id
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE (owner only)
router.put('/:id', requireAuth, requireOrganizer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (String(event.organizer) !== req.user.id) {
      return res.status(403).json({ message: 'You can edit only your own events' });
    }
    ['title', 'description', 'category', 'club', 'venue', 'date', 'capacity'].forEach((f) => {
      if (req.body[f] !== undefined) event[f] = req.body[f];
    });
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE (owner only)
router.delete('/:id', requireAuth, requireOrganizer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (String(event.organizer) !== req.user.id) {
      return res.status(403).json({ message: 'You can delete only your own events' });
    }
    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch {
    res.status(400).json({ message: 'Invalid event id' });
  }
});

// RSVP toggle
router.post('/:id/rsvp', requireAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const idx = event.attendees.findIndex((a) => String(a) === req.user.id);
    if (idx >= 0) {
      event.attendees.splice(idx, 1);
    } else {
      if (event.attendees.length >= event.capacity) {
        return res.status(400).json({ message: 'Event is full' });
      }
      event.attendees.push(req.user.id);
    }
    await event.save();
    res.json({ going: idx < 0, attendees: event.attendees.length });
  } catch {
    res.status(400).json({ message: 'Invalid event id' });
  }
});

module.exports = router;
