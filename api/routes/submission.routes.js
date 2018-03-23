const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const SubmissionController = require('../controllers/submission.controller')

router.post('/', checkAuth, SubmissionController.create);

router.patch('/:submissionId', checkAuth, SubmissionController.update);

// router.post('/:submissionId/changeState', checkAuth, SubmissionController.change_state);

router.post('/:submissionId/reject', checkAuth, SubmissionController.reject);

router.post('/:submissionId/approve', checkAuth, SubmissionController.approve);

router.get('/:submissionId', checkAuth, SubmissionController.get);

module.exports = router;