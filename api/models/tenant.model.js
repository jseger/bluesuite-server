const mongoose = require('mongoose');

const tenantSchema = mongoose.Schema({
  _id: mongoose.Schema.ObjectId,
  name: {type: String, required: true},
  createdBy: {type: mongoose.Schema.ObjectId, ref: 'User'},
  createdAt: {type: Date, default: Date.now},
  users: [ {type: mongoose.Schema.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Tenant', tenantSchema);