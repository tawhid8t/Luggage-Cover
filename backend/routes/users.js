const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    res.json({ success: true, total, count: users.length, data: users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { fullName, username, email, password, role, status } = req.body;
    if (!fullName || !username || !password) {
      return res.status(400).json({ success: false, message: 'fullName, username, and password are required.' });
    }
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) return res.status(400).json({ success: false, message: 'Username or email already exists.' });
    const user = await User.create({ fullName, username, email, password, role: role || 'support', status: status || 'active' });
    user.password = undefined;
    res.status(201).json({ success: true, data: user });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { fullName, email, role, status } = req.body;
    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (email !== undefined) updates.email = email;
    if (role) updates.role = role;
    if (status) updates.status = status;
    const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.patch('/:id/password', protect, authorize('admin'), async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    const hashed = await bcrypt.hash(password, 12);
    await User.findByIdAndUpdate(req.params.id, { $set: { password: hashed } });
    res.json({ success: true, message: 'Password updated.' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete an admin user.' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
