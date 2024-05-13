const express = require('express');
const accountsController = require('./../controllers/account')
const authController = require('../controllers/authController')

const router = express.Router();

router.use(authController.protect)

router.get('/user', accountsController.fetchUserAccounts)


// Only available for admin
router.use(authController.restrictTo('admin'))
router.get('/credit', accountsController.creditClientAccount)

module.exports = router;