const mongoose = require('mongoose');
const relationship = require('mongoose-relationship');

const submissionSchema = mongoose.Schema({
  _id: mongoose.Schema.ObjectId,
  submittedBy: {type: mongoose.SchemaTypes.ObjectId, ref: 'User'},
  submittedDate: {type: Date, required: true},
  state: {type: String, required: true, default: 'Editing'},
  data: {type: mongoose.SchemaTypes.Mixed},
  approvedBy: [{type: mongoose.SchemaTypes.ObjectId, ref: 'User'}],
  rejectedBy: [{type: mongoose.SchemaTypes.ObjectId, ref: 'User'}],
  rejectionReasons: [{
    date: {type: Date},
    name: {type: String},
    comment: {type: String}
  }]
});

module.exports = mongoose.model('Submission', submissionSchema);