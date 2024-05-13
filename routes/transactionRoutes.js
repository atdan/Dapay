const express = require('express');
const transactionController = require('./../controllers/transaction')
const authController = require('../controllers/authController')

const router = express.Router();



router.route('/account-lookup').post(transactionController.accountLookup)

// router.get('/checkout-session/:productId', authController.protect, transactionController.getCheckoutSessionSingleProduct);




module.exports = router;