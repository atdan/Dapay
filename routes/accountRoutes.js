const express = require('express');
const accountsController = require('./../controllers/account')
const authController = require('../controllers/authController')

const router = express.Router();

router.use(authController.protect)

router.get('/', accountsController.fetchUserAccounts)


// Only available for admin
router.use(authController.restrictTo('system'))
router.post('/credit', accountsController.creditClientAccount)

module.exports = router;