const mongoose = require('mongoose');
const relationship = require('mongoose-relationship');

const appSchema = mongoose.Schema({
  _id: mongoose.Schema.ObjectId,
  name: {type: String, required: true},
  createdBy: {type: mongoose.Schema.ObjectId, ref: 'User'},
  createdAt: {type: Date, default: Date.now},
  collaborators: [ {type: mongoose.Schema.ObjectId, ref: 'User', childPath: 'collaborating' }],
  sharedWith: [{type: mongoose.Schema.ObjectId, ref: 'User', childPath: 'sharedWithMe'}],
  form: {
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
      preview: {type: String},
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
  }
});

appSchema.plugin(relationship, { relationshipPathName:['collaborators', 'sharedWith'] });

module.exports = mongoose.model('App', appSchema);