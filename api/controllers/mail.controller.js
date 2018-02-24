const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAIL_DOMAIN});

exports.send_test = (req, res, next) => {
  var data = {
    from: 'BlueSuite Admin <admin@bluewavedatasystems.com>',
    to: 'jesse.seger@gmail.com',
    subject: 'Hello',
    text: 'Testing some Mailgun awesomness!'
  };
  
  mailgun.messages().send(data, function (error, body) {
    if(error) {
      res.status(500).json({
        message: 'Error sending test email.',
        error: error
      });
    } else {
      res.status(200).json({
        message: 'Mail sent.',
        body: body
      });
    }
  });
};