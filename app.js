const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

require('dotenv').config();

// connect to database
mongoose.connect(process.env.DB_HOST)
.catch((err) => {
  console.log(err)
});

// middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// cors
app.use((req, res, next) => {
  console.log(req.method.toLowerCase());
  var allowedOrigins = ['http://localhost:8080', 'https://mybluesuite.azurewebsites.net'];
  var origin = req.header('origin');
  console.log(origin)
  if (allowedOrigins.indexOf(origin) > -1) {
    res.header('Access-Control-Allow-Origin', origin); 
  } else {
    res.header('Access-Control-Allow-Origin', '*')    
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
  }
  next();
});

// api routes
const userRoutes = require('./api/routes/user.routes');
const mailRoutes = require('./api/routes/mail.routes');
const appRoutes = require('./api/routes/app.routes');

app.use('/user', userRoutes);
app.use('/mail', mailRoutes);
app.use('/apps', appRoutes);

app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

// catch errors
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  })
});

module.exports = app;