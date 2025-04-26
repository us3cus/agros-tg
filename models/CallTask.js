const mongoose = require('mongoose');

const callTaskSchema = new mongoose.Schema({
  form_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Form' },
  call_at: { type: Date, required: true },
  status: { type: String, default: 'pending' }
});

module.exports = mongoose.model('CallTask', callTaskSchema);
