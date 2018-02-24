const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const TenantController = require('../controllers/tenants.controller')

router.get('/', checkAuth, TenantController.tenants_get_all);

router.get('/:tenantId', checkAuth, TenantController.tenants_get);

router.post('/create', checkAuth, TenantController.tenants_create);

router.post('/join', checkAuth, TenantController.tenants_join);

router.post('/:tenantId', checkAuth, TenantController.tenants_update);

router.delete('/:tenantId', checkAuth, TenantController.tenants_delete);

module.exports = router;