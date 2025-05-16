const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderSchema = new mongoose.Schema({
  order_id: { type: String, default: () => uuidv4(), unique: true },
  company_name: String,
  contacts: String,
  drones: [String],
  date: String,
  created_at: { type: Date, default: Date.now },
  author_id: Number,
  status: { type: String, default: 'pending' }
});

module.exports = mongoose.model('Order', orderSchema); 