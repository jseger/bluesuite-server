const mongoose = require('mongoose');

const submissionSchema = mongoose.Schema({
  _id: mongoose.Schema.ObjectId,
  appId: {type: mongoose.SchemaTypes.ObjectId, ref: 'App'},
  submittedBy: {type: mongoose.SchemaTypes.ObjectId, ref: 'User'},
  submittedDate: {type: Date, required: true},
  currentState: {type: String},
  data: {type: mongoose.SchemaTypes.Mixed},
  stateHistory:[{
    state: {type: String},
    sequence: {type: Number},
    date: {type: Date},
    userId: {type: mongoose.SchemaTypes.ObjectId, ref: 'User'}
  }],
  approvalHistory:[{
    state: {type: String},
    sequence: {type: Number},
    date: {type: Date},
    userId: {type: mongoose.SchemaTypes.ObjectId, ref: 'User'},
    comment: {type: String},
    approved: {type: Boolean},
    rejected: {type: Boolean}
  }]
});

module.exports = mongoose.model('Submission', submissionSchema);