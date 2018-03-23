const mongoose = require('mongoose');

const appUserSchema = mongoose.Schema({
  _id: mongoose.Schema.ObjectId,
  app: {type: mongoose.Schema.ObjectId, ref: 'App'},
  user: {type: mongoose.Schema.ObjectId, ref: 'User', childPath: 'apps' },
  roles: [{type: String}]
});

module.exports = mongoose.model('AppUser', appUserSchema);