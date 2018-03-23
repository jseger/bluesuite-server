const express = require('express');
const mongoose = require('mongoose');
const App = require('../models/app.model');
const User = require('../models/user.model');
const Submission = require('../models/submission.model')
const AppUser = require('../models/appUser.model');

exports.get_all = (req, res, next) => {
  const userId = req.userData.userId;
  const appId = req.params.appId;
  const page = req.params.page || 0;
  const limit = req.params.limit || 100;

  App.findById(appId)
  .exec()
  .then(app => {
    if(app === null || app === undefined) {
      res.status(404).json({
        message: 'Not found.'
      });
      return;
    }

    if(app.createdBy.toString() === userId || app.collaborators.some(c => c._id.toString() === userId)) {
      Submission.find({$and:[
        {"appId": {"$eq": appId}},
        {"currentState": {"$ne": ""}}
      ]})
      .skip(page * limit).limit(limit)
      .populate('submittedBy')
      .then(submissions => {
        res.status(200).json({
          submissions: submissions
        });
        return;
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({error: err.message});
      });
    } else {
      res.status(401).json({
        message: 'You are not the creator or a collaborator of this app.'
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({error: err.message});
  });
};

exports.get = (req, res, next) => {
  const userId = req.userData.userId;
  const submissionId = req.params.submissionId
  console.log(submissionId)
  Submission.findById(submissionId)
  .populate('submittedBy')
  .populate('stateHistory.userId')
  .populate('approvalHistory.userId')
  .exec()
  .then(submission => {
    if(submission === null || submission === undefined) {
      res.status(404).json({
        message: 'Not found.'
      });
      return;
    } else {
      AppUser.findOne({app: submission.appId, user: userId})
      .populate('app')
      .populate('user')
      .exec()
      .then(appUser => {
        if((appUser.roles.some(r => r === 'user') && submission.submittedBy._id === userId) || appUser.roles.some(r => r === 'admin' || 'approver')){
          res.status(200).json({
            submission: submission,
            appUser: appUser
          });
        } else {
          res.status(401).json({
            message: 'You do not have permission to view this submission.'
          });
        }
      })
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({status: 500, data: null, message: err.message});
  });
};

exports.create = (req, res, next) => {
  const userId = req.userData.userId;
  const appId = req.body.appId;
  const state = req.body.state;

  AppUser.findOne({app: appId, user: userId})
  .populate('app')
  .exec()
  .then(appUser => {
    if(appUser !== null && appUser !== undefined) {
      if(appUser.roles.some(r => r === 'user' || r === 'admin')) {
        // make sure we are allowed to save submissions without a state
        var foundState = appUser.app.workflow.states.find(s => s.name === state);
        var isAdmin = appUser.roles.some(r => r === 'admin');
        if((foundState === undefined && appUser.app.workflow.allowSaveForm) || (foundState !== undefined && foundState.userAction) || (foundState !== undefined && foundState.adminAction && isAdmin)) {
          var now = Date.now();
          var submission = new Submission({
            _id: new mongoose.Types.ObjectId(),
            currentState: state || '',
            submittedBy: userId,
            submittedDate: now,
            data: req.body.data,
            appId: appId
          });

          if(state) {
            submission.stateHistory.push({
              state: state,
              sequence: 0,
              date: now,
              userId: userId
            });
          }

          submission.save()
          .then(submissionResult => {
            res.status(200).json({
              submission: submissionResult
            });
            return;
          });
        } else {
          res.status(401).json({
            message: 'You are not allowed to save this form.'
          });
        }
      } else {
        res.status(401).json({
          message: 'You are not allowed to save this form.'
        });
      }
    } else {
      res.status(404).json({
        message: 'Not found.'
      });
      return;
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({message: err.message});
  });
};

exports.update = (req, res, next) => {
  const userId = req.userData.userId;
  const data = req.body.data;
  const submissionId = req.params.submissionId;

  Submission.findById(submissionId)
  .populate('appId')
  .exec()
  .then(submission => {
    if(submission === null || submission === undefined) {
      res.status(404).json({
        message: 'Not found.'
      });
      return;
    }

    const app = submission.appId;
    const currentState = app.workflow.states.find(s => s.name === submission.currentState);
    const isNew = submission.currentState === null || submission.currentState === undefined;
    const isCurrentUser = submission.submittedBy.toString() === userId;

    if(isNew && isCurrentUser && !app.workflow.allowSaveForm) {
      res.status(401).json({
        message: 'You cannot edit this submission.'
      });
      return;
    } 

    AppUser.findOne({app: app._id, user: userId})
    .exec()
    .then(appUser => {
      if(appUser === null || appUser === undefined){
        res.status(401).json({
          message: 'User not found.'
        });
        return;
      }

      const isAdmin = appUser.roles.some(r => r === 'admin');

      if(!isAdmin && !isCurrentUser) {
        res.status(401).json({
          message: 'You are not a user for this app.'
        });
        return;
      }

      console.log(isNew && isCurrentUser && app.workflow.allowSaveForm);
      console.log(!isNew && isCurrentUser && currentState.userCanEdit);
      console.log(!isNew && isAdmin && currentState.adminCanEdit);

      if((isNew && isCurrentUser && app.workflow.allowSaveForm) || (!isNew && isCurrentUser && currentState.userCanEdit) || (!isNew && isAdmin && currentState.adminCanEdit)) {
        Submission.findByIdAndUpdate(submissionId, {$set: {data: data}}, {new: true})
        .exec()
        .then(submissionUpdate => {
          res.status(200).json({
            submission: submissionUpdate
          });
          return;
        })
        .catch(err => {
          console.log(err);
          res.status(500).json({message: err.message});
        });
      } else{
        res.status(401).json({
          message: 'You cannot edit this submission.'
        });
        return;
      }
    });
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({message: err.message});
  });
};

exports.change_state = (req, res, next) => {
  const userId = req.userData.userId;
  const submissionId = req.params.submissionId;
  const state = req.body.state;
  const comment = req.body.comment;

  Submission.findById(submissionId)
  .populate('appId')
  .exec()
  .then(submission => {
    if(submission === null || submission === undefined) {
      res.status(404).json({
        message: 'Not found.'
      });
      return;
    }
    
    var app = submission.appId;
    var isAdmin = app.createdBy.toString() === userId || app.collaborators.some(c => c._id.toString() === userId);

    // make sure we are allows to change the state
    var foundState = app.workflow.states.find(s => s.name === state);
    if(foundState !== null && foundState !== undefined && (foundState.userAction || (isAdmin && foundState.adminAction))) {
      // we can change the state
      var updateObj = {
        $set: {
          currentState: state
        },
        $push: {
          history: {
            state: state,
            sequence: 0,
            comment: comment,
            date: Date.now(),
            userId: userId,
            approved: false,
            rejected: false
          }
        }
      };

      Submission.findByIdAndUpdate(submissionId, updateObj, {new: true})
      .exec()
      .then(submissionUpdate => {
        res.status(200).json({
          submission: submissionUpdate
        });
        return;
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({message: err.message});
      });
    } else {
      res.status(401).json({
        message: 'You cannot change the state on this submission.'
      });
      return;
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({message: err.message});
  });
};

exports.approve = (req, res, next) => {
  const userId = req.userData.userId;
  const submissionId = req.params.submissionId;
  const comment = req.body.comment;

  Submission.findById(submissionId)
  .populate('appId')
  .exec()
  .then(submission => {
    if(submission === null || submission === undefined) {
      res.status(404).json({
        message: 'Not found.'
      });
      return;
    }

    const app = submission.appId;
    const currentState = app.workflow.states.find(s => s.name === submission.currentState);

    if(currentState === null || currentState === undefined) {
      res.status(401).json({
        message: 'Application error. State ' + submission.currentState + ' does not exist.'
      });
      return;
    }

    if(!currentState.requireApproval) {
      res.status(401).json({
        message: 'State ' + submission.currentState + ' does not require approval.'
      });
      return;
    }

    AppUser.findOne({app: app._id, user: userId})
    .exec()
    .then(appUser => {
      if(appUser === null || appUser === undefined){
        res.status(401).json({
          message: 'Approver not found.'
        });
        return;
      }

      if(!appUser.roles.some(r => r === 'approver')) {
        res.status(401).json({
          message: 'You are not an approver for this state.'
        });
        return;
      }

      // we can begin to approve the submission
      // find the current max sequence
      const now = Date.now();
      var sequence = 0;
      for (let i = 0; i < submission.stateHistory.length; i++) {
        const history = submission.stateHistory[i];
        sequence = Math.max(sequence, history.sequence);
      }

      // let's see if we've already approved this submission
      const approval = submission.approvalHistory.find(a => a.sequence === sequence && a.state === submission.currentState && a.userId.toString() === userId && a.approved);
      if(approval !== null && approval !== undefined) {
        res.status(200).json(submission);
        return;
      } else {
        // add an approval to the approval history
        Submission.findOneAndUpdate({
          _id: submissionId
        },{
          $push:{
            approvalHistory:{
              approved: true,
              rejected: false,
              date: now,
              comment: comment,
              sequence: sequence,
              state: submission.currentState,
              userId: userId
            }
          }
        },{ 
          new: true
        }).exec()
        .then(result => {
          console.log(result);
          // we have to check if we need to transition the file
          // loop backwards to see if we have enough approvals
          var userApprovals = {}
          for (let i = result.approvalHistory.length; i-- > 0;) {
            const a = result.approvalHistory[i];
            if(!(a.userId in userApprovals)){
              userApprovals[a.userId] = a.approved;
            }
          }

          var approvalCount = 0;
          for (const key in userApprovals) {
            if (userApprovals.hasOwnProperty(key)) {
              const element = userApprovals[key];
              if(element){
                approvalCount++;
              }
            }
          }

          if(approvalCount >= currentState.minimumApprovals) {
            // change the state
            Submission.findOneAndUpdate({
              _id: submissionId
            },{
              $set: {
                currentState: currentState.approvedState
              },
              $push: {
                stateHistory: {
                  date: now,
                  state: currentState.approvedState,
                  userId: userId,
                  sequence: sequence + 1
                }
              }
            },{
              new: true
            }).exec()
            .then(result => {
              console.log('changed state');
              res.status(200).json(result);
            })
          } else{
            res.status(200).json(result);
            return;
          }
        })
      }
    })          
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({message: err.message});
  });
};

exports.reject = (req, res, next) => {
  const userId = req.userData.userId;
  const submissionId = req.params.submissionId;
  const comment = req.body.comment;

  Submission.findById(submissionId)
  .populate('appId')
  .exec()
  .then(submission => {
    if(submission === null || submission === undefined) {
      res.status(404).json({
        message: 'Not found.'
      });
      return;
    }

    const app = submission.appId;
    const currentState = app.workflow.states.find(s => s.name === submission.currentState);

    if(currentState === null || currentState === undefined) {
      res.status(401).json({
        message: 'Application error. State ' + submission.currentState + ' does not exist.'
      });
      return;
    }

    if(!currentState.requireApproval) {
      res.status(401).json({
        message: 'State ' + submission.currentState + ' does not require approval.'
      });
      return;
    }

    AppUser.findOne({app: app._id, user: userId})
    .exec()
    .then(appUser => {
      if(appUser === null || appUser === undefined){
        res.status(401).json({
          message: 'Approver not found.'
        });
        return;
      }

      if(!appUser.roles.some(r => r === 'approver')) {
        res.status(401).json({
          message: 'You are not an approver for this state.'
        });
        return;
      }

      // we can begin to approve the submission
      // find the current max sequence
      const now = Date.now();
      var sequence = 0;
      for (let i = 0; i < submission.stateHistory.length; i++) {
        const history = submission.stateHistory[i];
        sequence = Math.max(sequence, history.sequence);
      }

      // let's see if we've already rejected this submission
      const approval = submission.approvalHistory.find(a => a.sequence === sequence && a.state === submission.currentState && a.userId.toString() === userId && a.rejected);
      if(approval !== null && approval !== undefined) {
        console.log(approval);
        res.status(200).json(submission);
        return;
      } else {
        // add a rejection to the approval history
        Submission.findOneAndUpdate({
          _id: submissionId
        },{
          $push:{
            approvalHistory:{
              approved: false,
              rejected: true,
              date: now,
              comment: comment,
              sequence: sequence,
              state: submission.currentState,
              userId: userId
            }
          }
        },{ 
          new: true
        }).exec()
        .then(result => {
          console.log('updated approval history');
          console.log(result);
          // we have to check if we need to transition the file
          // loop backwards to see if we have enough rejections
          var userRejections = {}
          for (let i = result.approvalHistory.length; i-- > 0;) {
            const a = result.approvalHistory[i];
            if(!(a.userId in userRejections)){
              userRejections[a.userId] = a.rejected;
            }
          }

          var rejectionCount = 0;
          for (const key in userRejections) {
            if (userRejections.hasOwnProperty(key)) {
              const element = userRejections[key];
              if(element){
                rejectionCount++;
              }
            }
          }

          console.log((currentState.approvers.length - rejectionCount));
          console.log(currentState.minimumApprovals);
          if((currentState.approvers.length - rejectionCount) < currentState.minimumApprovals || currentState.minimumApprovals <= 0) {
            // change the state
            Submission.findOneAndUpdate({
              _id: submissionId
            },{
              $set: {
                currentState: currentState.rejectedState
              },
              $push: {
                stateHistory: {
                  date: now,
                  state: currentState.rejectedState,
                  userId: userId,
                  sequence: sequence + 1
                }
              }
            },{
              new: true
            }).exec()
            .then(result => {
              console.log('changed state')
              console.log(result);
              res.status(200).json(result);
            })
          } else{
            res.status(200).json(result);
            return;
          }
        })
      }
    })          
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({message: err.message});
  });
};