const express = require('express');
const transactionController = require('./../controllers/transaction')
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/webhook', transactionController.recievePaymentWebhook)


router.use(authController.protect)

// Only available for system
router.use(authController.restrictTo('system')).get('/account', transactionController.fetchSystemAccounts)


module.exports = router;