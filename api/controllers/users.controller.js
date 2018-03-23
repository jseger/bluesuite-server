const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/user.model');
const Submission = require('../models/submission.model');
const App = require('../models/app.model');
const AppUser = require('../models/appUser.model');

exports.user_signup = (req, res, next) => {
  User.find({email: req.body.email}).exec()
  .then(user => {
    if (user.length >= 1) {
      return res.status(409).json({
        message: "Email exists"
      });
    } else { 
      bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
          return res.status(500).json({
            error: err
          });
        } else {
          const user = new User({
            _id: mongoose.Types.ObjectId(),
            email: req.body.email,
            password: hash,
            name: req.body.name
          }); 
          user.save()
          .then(result => {
            const token = jwt.sign({
              email: user.email,
              userId: user._id,
              name: user.name
            }, 
            process.env.JWT_KEY, 
            {
              expiresIn: "24h"
            });
            res.status(200).json({
              message: 'User Created',
              token: token
            });
          })
          .catch(err => {
            res.status(500).json({
              error: err
            });
          });
        }
      });
    }
  });
};

exports.user_login = (req, res, next) => {
  User.find({email: req.body.email}).exec()
  .then(user => {
    if (user.length < 1) {
      return res.status(401).json({
        message: 'Auth failed no user'
      });
    } else {
      bcrypt.compare(req.body.password, user[0].password, (err, result) => {
        if (err) {
          return res.status(401).json({
            message: 'Auth failed'
          });
        }
        if (result) {
          const token = jwt.sign({
            email: user[0].email,
            userId: user[0]._id,
            name: user[0].name
          }, 
          process.env.JWT_KEY, 
          {
            expiresIn: "24h"
          });
          return res.status(200).json({
            message: 'Auth successful',
            token: token
          });
        }
        return res.status(401).json({
          message: 'Auth failed'
        });
      });
    }
  })
  .catch(err => {
    res.status(500).json({
      error: err
    });
  });
};

exports.user_change_password = (req, res, next) => {
  User.findById(req.userData.userId).exec()
  .then(user => {
    if (!user) {
      return res.status(404).json({
        message: 'Bad request. No user.'
      });
    } else {
      console.log(req.body.password)
      bcrypt.compare(req.body.password, user.password, (err, result) => {
        if (err || !result) {
          return res.status(401).json({
            message: 'Auth failed'
          });
        }
        // hash the new password
        bcrypt.hash(req.body.newPassword, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err
            });
          } else {
            console.log(user)
            user.password = hash;
            user.save()
            .then(result => {
              res.status(200).json({
                message: 'Password changed.'
              });
            })
            .catch(err => {
              console.log(err)
              res.status(500).json({
                error: err
              });
            });
          }
        });
      });
    }
  })
  .catch(err => {
    res.status(500).json({
      error: err
    });
  });
};

exports.user_refresh_token = (req, res, next) => {
  const token = jwt.sign({
    email: req.userData.email,
    userId: req.userData.userId,
    name: req.userData.name
  }, 
  process.env.JWT_KEY, 
  {
    expiresIn: "24h"
  });
  return res.status(200).json({
    message: 'Auth successful',
    token: token
  });
};

exports.user_delete = (req, res, next) => {
  User.remove({_id: req.body.userId})
  .exec()
  .then(result => {
    res.status(200).json({
      message: "User deleted"
    });
  })
  .catch(err => {
    res.status(500).json({
      error: err
    });
  });
};

exports.update_user = (req, res, next) => {
  const id = req.userData.userId;
  console.log(id);
  const updateOps = {};
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }
  console.log(updateOps);
  User.findOneAndUpdate({_id: id}, { $set: updateOps}, {new: true})
  .exec()
  .then(user => {
    console.log('updated user')
    console.log(user)
    const token = jwt.sign({
      email: user.email,
      userId: user._id,
      name: user.name
    }, 
    process.env.JWT_KEY, 
    {
      expiresIn: "24h"
    });
    return res.status(200).json({
      message: 'Update successful',
      token: token
    });
  })
  .catch(err => {
    res.status(500).json({error: err});
  });
};

exports.search_by_email = (req, res, next) => {
  User.findOne({ email: req.body.email})
  .exec()
  .then(user => {
    if(user === null || user === undefined) {
      res.status(404).json({
        message: 'Not found'
      })
    } else {
      res.status(200).json({
        user: {
          name: user.name,
          email: user.email,
          _id: user._id
        }
      });
    }
  })
  .catch(err => {
    res.status(500).json({status: 500, data: null, message: err.message});
  })
};

exports.get_submissions = (req, res, next) => {
  const userId = req.params.userId;
  const appId = req.params.appId;
  const requestedByUserId = req.userData.userId;
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

    if(app.createdBy.toString() === userId || app.collaborators.some(c => c.toString() === userId) || userId === requestedByUserId) {
      Submission.find({$and:[
        {"appId": {"$eq": appId}},
        {"submittedBy": {"$eq": userId}}
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
        res.status(500).json({message: err});
      });
    } else {
      res.status(401).json({
        message: 'You are not the creator or a collaborator of this app.'
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({message: err});
  });
};

exports.get_forms = (req, res, next) => {
  const id = req.userData.userId;
  User.findById(id)
  .populate('sharedWithMe')
  .exec()
  .then(user => {
    res.status(200).json({
      forms: user.sharedWithMe
    });
  })
  .catch(err => {
    res.status(500).json({status: 500, data: null, message: err.message});
  });
};

exports.get_apps = (req, res, next) => {
  const userId = req.userData.userId || req.params.userId;
  console.log(userId)
  AppUser.find({user: userId})
  .populate('app')
  .populate('user')
  .exec()
  .then(apps => {
    console.log(apps)
    res.status(200).json(apps);
  })
  .catch(err => {
    res.status(500).json({status: 500, data: null, message: err.message});
  });
};