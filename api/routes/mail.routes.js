const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const MailController = require('../controllers/mail.controller')

router.post('/test', MailController.send_test);

module.exports = router;