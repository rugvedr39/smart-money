const mongoose = require('mongoose');

const teamHierarchySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  level: { type: Number, required: true }
});

const TeamHierarchy = mongoose.model('TeamHierarchy', teamHierarchySchema);
module.exports = TeamHierarchy;
