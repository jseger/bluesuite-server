const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const AppController = require('../controllers/app.controller')

router.post('/create', checkAuth, AppController.app_create);

router.post('/share', checkAuth, AppController.share);

router.post('/addCollaborator', checkAuth, AppController.add_collaborator);

router.delete('/:appId', checkAuth, AppController.app_delete);

router.patch('/:appId', checkAuth, AppController.app_update);

router.get('/:appId', checkAuth, AppController.get);

module.exports = router;