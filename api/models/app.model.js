const mongoose = require('mongoose');

const appSchema = mongoose.Schema({
  _id: mongoose.Schema.ObjectId,
  name: {type: String, required: true},
  createdBy: {type: mongoose.Schema.ObjectId, ref: 'User'},
  createdAt: {type: Date, default: Date.now},
  form: {
    preview: {type: String},
    fields: [{
      _id: false,
      id: {type: String, required: true},
      name: {type: String, required: true},
      type: {type: String, required: true},
      defaultValue: {type: Object },
      label: {type: String },
      prefix: {type: String},
      suffix: {type: String},
      required: {type: Boolean, required: true},
      multiline: {type: Boolean},
      options: [{type: String}],
      multiple: {type: Boolean},
      lookupList: {type: mongoose.Schema.ObjectId},
      lookupListFields: [{type: String}],
      labelColor: {type: String},
      labelIcon: {type: String},
      width: {type: String, default: 'xs12 pa-3'},
      calculation: {type: String},
      preview: {type: Boolean},
      horizontal: {type: Boolean},
      tableColumns: [{
        _id: false,
        id: {type: String, required: true},
        name: {type: String, required: true},
        columnType: {type: String, required: true},
        defaultValue: {type: Object},
        label: {type: String, required: true},
        prefix: {type: String},
        suffix: {type: String},
        required: {type: Boolean, required: true},
        multiline: {type: Boolean},
        options: [{type: String}],
        multiple: {type: Boolean},
        lookupList: {type: mongoose.Schema.ObjectId},
        lookupField: {type: String},
        labelColor: {type: String},
        labelIcon: {type: String},
        alignText: {type: String},
        calculation: {type: String},
        preview: {type: Boolean}
      }]
    }]
  },
  workflow: {
    allowMultipleSubmissions: {type: Boolean, required: true, default: true},
    allowSaveForm: {type: Boolean, required: true, default: true},
    states: [{
      _id: false,
      name: {type: String, required: true},
      adminAction: {type: Boolean, required: true, default: true},
      userAction: {type: Boolean, required: true, default: false},
      actionName: {type: String, required: true},
      sendNotificationToCollaborators: {type: Boolean, required: true, default: true},
      requireApproval: {type: Boolean, required: true, default: true},
      sendAdditionalNotifications: {type: Boolean, required: true, default: true},
      sendNotificationToSubmitter: {type: Boolean, required: true, default: true},
      alsoNotify: [{type: String}],
      approvers: [ {type: mongoose.Schema.ObjectId }],
      minimumApprovals: {type: Number, default: 0},
      approvedState: {type: String},
      rejectedState: {type: String},
      color: {type: String},
      userCanEdit: {type: Boolean, required: true, default: false},
      adminCanEdit: {type: Boolean, required: true, default: true}
    }]
  }
});

module.exports = mongoose.model('App', appSchema);