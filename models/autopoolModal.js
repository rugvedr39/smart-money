const mongoose = require('mongoose');

const autoPoolSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teamCount: { type: Number, default: 0 }, // Tracks total team size under this user
  createdAt: { type: Date, default: Date.now }
});

const AutoPool = mongoose.model('AutoPool', autoPoolSchema);
module.exports = AutoPool;