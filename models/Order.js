const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderSchema = new mongoose.Schema({
  order_id: { type: String, default: () => uuidv4(), unique: true },
  company_name: String,
  contacts: String,
  equipment: {
    name: String,
    price: Number,
    nds: Number,
    pieces: Number,
    price_total: Number,
    nds_total: Number
  },
  seller_info: {
    name: String,
    director: String,
    data: String
  },
  agreement_date: String,
  contact_number: String,
  created_at: { type: Date, default: Date.now },
  author_id: Number,
  status: { type: String, default: 'pending' }
});

module.exports = mongoose.model('Order', orderSchema); 