const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  _id: mongoose.Schema.ObjectId,
  email: {
    type: String, 
    required: true, 
    unique: true, 
    match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
  },
  name: {type: String, required: true},
  password: {type: String, required: true},
  createdAt: {type: Date, default: Date.now, required: true},
  collaborating: [{type: mongoose.Schema.ObjectId, ref: 'App'}],
  sharedWithMe: [{type: mongoose.Schema.ObjectId, ref: 'App'}],
  approving: [{type: mongoose.Schema.ObjectId, ref: 'App'}]
});

module.exports = mongoose.model('User', userSchema);