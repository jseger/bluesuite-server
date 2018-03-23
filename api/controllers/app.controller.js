const express = require('express');
const mongoose = require('mongoose');
const App = require('../models/app.model');
const AppUser = require('../models/appUser.model');
const User = require('../models/user.model');
const Submission = require('../models/submission.model');

exports.get = (req, res, next) => {
  const userId = req.userData.userId;
  const appId = req.params.appId;

  AppUser.findOne({app: appId, user: userId})
  .populate('app')
  .populate('user')
  .populate('app.workflow.approvers')
  .exec()
  .then(result => {
    res.status(200).json(result);
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({status: 500, data: null, error: err.message});
  });
};

exports.app_update = (req, res, next) => {
  const userId = req.userData.userId;
  const appId = req.params.appId;

  AppUser.findOne({app: appId, user: userId})
  .exec()
  .then(appUser => {
    if(appUser !== null && appUser !== undefined && appUser.roles.indexOf('admin') > -1) {
      App.findOneAndUpdate({_id: appId}, { $set: req.body}, {new: true})
      .exec()
      .then(app => {
        res.status(200).json({
          app: app
        });
      })
    } else {
      res.status(401).json({
        message: 'You do not have permissions to edit this app.'
      })
    }
  })
  .catch(err => {
    res.status(500).json({error: err.message});
  });
};

exports.app_create = (req, res, next) => {
  const userId = req.userData.userId;

  const app = new App({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    createdBy: userId,
    form: req.body.form,
    workflow: req.body.workflow,
    createdAt: Date.now()
  });
  
  app.save()
  .then(app => {
    const appUser = new AppUser({
      _id: new mongoose.Types.ObjectId(),
      user: userId,
      app: app._id,
      roles: ['admin', 'user', 'approver']
    });

    appUser.save()
    .then(appUser => {
      AppUser.populate(appUser, {path: 'app'})
      .then(result => {
        res.status(200).json(result);
      });
    });
  })
  .catch(err => {
    console.log(err)
    res.status(500).json({error: err.message});
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
    app.remove()
    .then(result => {
      AppUser.remove({app: appId})
      .then(result2 => {
        res.status(200).json({
          message: 'App deleted'
        });
      });
    });
  })
  .catch(err => {
    console.log(err)
    res.status(500).json({error: err.message});
  });
};

exports.get_submissions = (req, res, next) => {
  const userId = req.userData.userId;
  const appId = req.params.appId;
  const page = req.params.page || 0;
  const limit = req.params.limit || 100;

  AppUser.findOne({app: appId, user: userId})
  .populate('app')
  .exec()
  .then(appUser => {
    if (appUser === null || appUser === undefined){
      res.status(404).json({
        message: 'Not found.'
      });
      return;
    }

    // Submission.find({$and:[
    //   {"appId": {"$eq": appId}},
    //   {"currentState": {"$ne": ""}}
    // ]})
    if(appUser.roles.some(r => r === 'admin' || r === 'user' || r === 'approver')){
      Submission.find({"appId": {"$eq": appId}})
      .skip(page * limit).limit(limit)
      .populate('submittedBy')
      .then(submissions => {
        res.status(200).json({
          submissions: submissions,
          app: appUser.app,
          roles: appUser.roles
        });
        return;
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({error: err});
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

exports.get_users = (req, res, next) => {
  const appId = req.params.appId;
  AppUser.find({app: appId})
  .populate('user')
  .exec()
  .then(users => {
    res.status(200).json(users);
  })
  .catch(err => {
    res.status(500).json({status: 500, data: null, message: err.message});
  });
};

exports.add_user = (req, res, next) => {
  const userId = req.userData.userId;
  const appId = req.params.appId;
  const _userId = req.body.userId;
  const roles = req.body.roles;

  AppUser.findOne({app: appId, user: userId})
  .exec()
  .then(appUser => {
    // check to see if we're an admin
    console.log(appUser)
    if(appUser !== null && appUser !== undefined && appUser.roles.indexOf('admin') > -1){
      AppUser.findOneAndUpdate(
        {app: appId, user: _userId},
        new AppUser({
          user: _userId,
          app: appId,
          roles: roles
        }),
        {
          upsert: true, 
          new: true
        })
      .populate('user')
      .exec()
      .then(result => {
        res.status(200).json(result);
      });
    } else {
      res.status(401).json({
        message: 'You do not have permissions to add users to this app.'
      });
    }
  })
  .catch(err => {
    console.log(err)
    res.status(500).json({status: 500, data: null, message: err.message});
  });
};

exports.remove_user = (req, res, next) => {
  const userId = req.userData.userId;
  const appId = req.params.appId;
  const _userId = req.params.userId;

  AppUser.findOne({app: appId, user: userId})
  .exec()
  .then(appUser => {

    if(appUser !== null && appUser !== undefined && appUser.roles.indexOf('admin') > -1){
      
      AppUser.findOneAndRemove({app: appId, user: _userId})
      .then(result => {
        res.status(200).json({
          message: 'User removed'
        });
      });
      
    } else {
      res.status(401).json({
        message: 'You do not have permissions to remove users from this app.'
      });
    }

  })
  .catch(err => {
    console.log(err)
    res.status(500).json({status: 500, data: null, message: err.message});
  });
};