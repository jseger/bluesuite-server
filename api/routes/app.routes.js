const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const AppController = require('../controllers/app.controller')

router.post('/', checkAuth, AppController.app_create);

router.post('/:appId/addUser', checkAuth, AppController.add_user);

router.delete('/:appId/removeUser/:userId', checkAuth, AppController.remove_user);

router.delete('/:appId', checkAuth, AppController.app_delete);

router.patch('/:appId', checkAuth, AppController.app_update);

router.get('/:appId', checkAuth, AppController.get);

router.get('/:appId/submissions', checkAuth, AppController.get_submissions);

router.get('/:appId/users', checkAuth, AppController.get_users);

module.exports = router;