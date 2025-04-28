const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
  farm_name: { type: String, required: true },
  phone_number: { type: String, required: true },
  treatment_date: { type: String, required: true },
  chemical_name: { type: String, required: true },
  field_size: { type: Number, required: true },
  ph_before: { type: Number, required: true },
  ph_after: { type: Number, required: true },
  call_date: { type: String, required: true },
  call_time: { type: String, required: true },
  author_id: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Form', formSchema);
