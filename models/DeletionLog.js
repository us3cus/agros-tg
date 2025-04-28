const mongoose = require('mongoose');

const deletionLogSchema = new mongoose.Schema({
  form_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  deleted_by: { 
    user_id: { type: Number, required: true },
    first_name: { type: String, required: true }
  },
  deleted_at: { type: Date, default: Date.now },
  form_data: {
    farm_name: String,
    treatment_date: String,
    chemical_name: String,
    field_size: Number,
    ph_before: Number,
    ph_after: Number,
    call_date: String,
    call_time: String
  }
});

module.exports = mongoose.model('DeletionLog', deletionLogSchema); 