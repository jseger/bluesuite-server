const express = require('express');
const mongoose = require('mongoose');
const Tenant = require('../models/tenant.model');
const User = require('../models/user.model');

exports.tenants_get_all = (req, res, next) => {
  Tenant.find()
  .select('name')
  .exec()
  .then(docs => {
    const response = {
      count: docs.length,
      tenants: docs.map(doc => {
        return {
          name: doc.name,
          _id: doc._id
        };
      })
    };
    
    res.status(200).json(response);
  })
  .catch(err => {
    res.status(500).json({error: err});
  });
};

exports.tenants_get = (req, res, next) => {
  const id = req.params.tenantId;
  Tenant.findById(id)
  .exec()
  .then(doc => {
    if (doc) {
      res.status(200).json(doc);
    } else {
      res.status(404).json({message: 'Not found'});
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({error: err})
  });
};

exports.tenants_create = (req, res, next) => {
  User.findById(req.userData.userId)
  .exec()
  .then(user => {
    if (user.tenant) {
      throw "You can only create one tenant";
    } else {
      const tenant = new Tenant({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        createdBy: req.userData.userId
      });

      tenant.users.push(req.userData.userId);

      return tenant.save();
    }
  })
  .then(tenant => {
    User.update({_id: req.userData.userId}, {$set: {tenant: tenant._id}})
    .exec()
    .then(() => {
      res.status(201).json({
        message: 'Tenant Created',
        tenant: {
          _id: tenant._id,
          name: tenant.name,
          createdBy: tenant.createdBy
        }
      });
    });
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({error: err});
  });
};

exports.tenants_update = (req, res, next) => {
  const id = req.params.tenantId;
  console.log(id);
  const updateOps = {};
  for (const ops of req.body) {
    console.log(ops);
    updateOps[ops.propName] = ops.value;
  }
  console.log(updateOps);
  Tenant.update({_id: id}, { $set: updateOps})
  .exec()
  .then(result => {
    res.status(200).json(result);
  })
  .catch(err => {
    res.status(500).json({error: err});
  });
};

exports.tenants_join = (req, res, next) => {
  const id = req.params.tenantId;
  console.log(id);
  res.status(200).json({
    message: "Not implemented"
  })
};

exports.tenants_delete = (req, res, next) => {
  const id = req.params.tenantId
  Tenant.remove({_id: id})
  .exec()
  .then(result => {
    res.status(200).json({
      message: 'Tenant delete'
    });
  })
  .catch(err => {
    res.status(500).json({error: err});
  });
};