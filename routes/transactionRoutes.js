const express = require('express');
const orderController = require('./../controllers/transaction')
const authController = require('../controllers/authController')

const router = express.Router();



router.route('/account-lookup').post(orderController.getCheckoutCart)

router.get('/checkout-session/:productId', authController.protect, orderController.getCheckoutSessionSingleProduct);




module.exports = router;