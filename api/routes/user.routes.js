const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const UserController = require('../controllers/users.controller')

router.post('/signup', UserController.user_signup);

router.post('/login', UserController.user_login);

router.delete('/:userId', checkAuth, UserController.user_delete);

router.patch('/update', checkAuth, UserController.update_user);

router.post('/refreshToken', checkAuth, UserController.user_refresh_token);

router.post('/changePassword', checkAuth, UserController.user_change_password);

router.get('/me', checkAuth, UserController.my_data);

router.post('/search', checkAuth, UserController.search_by_email);

module.exports = router;