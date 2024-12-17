const mongoose = require('mongoose');

const SocialLinkSchema = new mongoose.Schema({
    platform: { type: String, required: true }, // e.g., 'Facebook', 'Twitter'
    url: { type: String, required: true }, // Social media link
    icon: { type: String, required: true }, // Bootstrap icon class
    createdAt: { type: Date, default: Date.now }, // Auto timestamp
  });
  
module.exports = mongoose.model('SocialLink', SocialLinkSchema);;