const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
  farm_name: String,
  phone_number: String,
  treatment_date: String,
  chemical_name: String,
  field_size: Number,
  ph_before_photo: { type: String, default: null }, // file_id из Telegram
  ph_after_photo: { type: String, default: null }, // file_id из Telegram
  call_date: String,
  call_time: String,
  author_id: Number,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Form', formSchema);
