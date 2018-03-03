const express = require('express');
const mongoose = require('mongoose');
const App = require('../models/app.model');
const User = require('../models/user.model');

exports.get = (req, res, next) => {
  const userId = req.userData.userId;
  const appId = req.params.appId;

  App.findById(appId)
  .populate('collaborators')
  .exec()
  .then(app => {
    if(app === null || app === undefined) {
      res.status(404).json({
        message: 'Not found.'
      });
      return;
    }

    if(app.createdBy.toString() === userId || app.collaborators.some(c => c._id.toString() === userId)) {
      res.status(200).json({
        app: app
      });
    } else {
      res.status(401).json({
        message: 'You are not the creator or a collaborator of this app.'
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({error: err});
  });
};

exports.add_collaborator = (req, res, next) => {
  const userId = req.userData.userId;
  const appId = req.body.appId;
  const collaboratorId = req.body.collaboratorId;
  console.log(collaboratorId)
  App.findById(appId)
  .exec()
  .then(app => {
    if(app.createdBy.toString() === userId) {
      console.log(mongoose.Types.ObjectId(collaboratorId))
      console.log(app.collaborators.indexOf(mongoose.Types.ObjectId(collaboratorId)))
      if (app.collaborators.indexOf(mongoose.Types.ObjectId(collaboratorId)) < 0) {
        app.collaborators.push(collaboratorId);
        app.save()
        .then(() => {
          res.status(200).json({
            message: 'User added!'
          });
        })
      } else {
        res.status(401).json({
          message: 'The user is already a collaborator.'
        });
      }
    } else {
      res.status(401).json({
        message: 'Only the creator can add collaborators.'
      });
    }
  })
  .catch(err => {
    console.log(err)
    res.status(500).json({status: 500, data: null, message: err.message});
  });
};

exports.remove_collaborator = (req, res, next) => {
  const userId = req.userData.userId;
  const appId = req.params.appId;
  const collaboratorId = req.params.collaboratorId;
  console.log("Params:" + req.params)
  console.log("UserId:         " + userId)
  console.log("CollaboratorId: " + collaboratorId)
  if(collaboratorId === null || collaboratorId === 'undefined') {
    res.status(401).json({
      message: 'Collaborator not found'
    });
    return;
  }
  if(appId === null || appId === 'undefined') {
    res.status(401).json({
      message: 'App not found'
    });
    return;
  }
  App.findById(appId)
  .exec()
  .then(app => {
    if(app.createdBy.toString() === userId) {
      if(app.createdBy.toString() !== collaboratorId) {
        app.collaborators.splice(app.collaborators.indexOf(collaboratorId), 1);
        app.save()
        .then(() => {
          res.status(200).json({
            message: 'User removed!'
          });
        })
      } else {
        res.status(401).json({
          message: 'You cannot remove yourself as a collaborator.'
        });
      }
    } else {
      res.status(401).json({
        message: 'Only the creator can remove collaborators.'
      });
    }
  })
  .catch(err => {
    console.log(err)
    res.status(500).json({status: 500, data: null, message: err.message});
  });
};

exports.share = (req, res, next) => {
  const userId = req.userData.userId;
  const appId = req.body.appId;
  const shareWithUserId = req.body.shareWithUserId;

  App.findById(appId)
  .exec()
  .then(app => {
    if(app.createdBy.toString() === userId || app.collaborators.some(id => id.toString() === userId)) {
      app.sharedWith.push(shareWithUserId);
      app.save()
      .then(() => {
        res.status(200).json({
          message: 'App shared with user!'
        });
      })
    } else {
      res.status(401).json({
        message: 'You are not the creator or collaborator of this app.'
      });
    }
  })
  .catch(err => {
    res.status(500).json({error: err});
  });
};

exports.app_update = (req, res, next) => {
  const id = req.params.appId;
  console.log(id);
  const updateOps = {};
  for (const ops of req.body) {
    console.log(ops);
    updateOps[ops.propName] = ops.value;
  }
  console.log(updateOps);
  App.findOneAndUpdate({_id: id}, { $set: updateOps}, {new: true})
  .populate('workflow.reviewing.approvers')
  .exec()
  .then(app => {
    if(app) {
      App.populate(app, {path: 'collaborators'})
      .then(app => {
        res.status(200).json({
          app: app
        });
      })
    } else {
      res.status(500).json({
        message: 'Not found.'
      });
    }
  })
  .catch(err => {
    res.status(500).json({error: err});
  });
};

exports.app_create = (req, res, next) => {
  const userId = req.userData.userId;
  const app = new App({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    createdBy: userId,
    form: req.body.form,
    workflow: req.body.workflow
  });
  app.collaborators.push(userId);
  app.save()
  .then(app => {
    App.populate(app, {path: 'collaborators'})
    .then(app => {
      res.status(200).json({
        app: app
      });
    })
  })
  .catch(err => {
    console.log(err)
    res.status(500).json({error: err});
  });
};

exports.app_delete = (req, res, next) => {
  const userId = req.userData.userId;
  const appId = req.params.appId;
  App.findById(appId).exec()
  .then(app => {
    console.log(app)
    if(app.createdBy.toString() !== userId){
      res.status(401).json({
        message: 'Only the user that created the app can delete it.'
      });
      return;
    }
/*     App.findOneAndRemove({_id:appId})
    .exec() */
    app.remove()
    .then(result => {
      res.status(200).json({
        message: 'App deleted'
      });
    })
  })
  .catch(err => {
    console.log(err)
    res.status(500).json({error: err});
  });
};