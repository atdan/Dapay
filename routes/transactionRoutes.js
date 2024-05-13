const express = require('express');
const transactionController = require('./../controllers/transaction')
const authController = require('../controllers/authController')

const router = express.Router();

router.use(authController.protect)

router.get('/countries', transactionController.fetchSupportedCountries)
router.get('/channels', transactionController.fetchChannels)
router.get('/networks', transactionController.fetchNetworks)
router.get('/rates', transactionController.fetchRates)
router.get('/countries', transactionController.fetchSupportedCountries)
router.get('/account-lookup', transactionController.accountLookup)
router.route('/transfer').post(transactionController.sendPaymentRequest)
router.get('/payment-lookup', transactionController.lookupPayment)
router.get('/payment-lookup-sq', transactionController.lookupPaymentBySequenceId)


// Only available for admin
router.use(authController.restrictTo('admin'))
router.get('/accounts', transactionController.fetchAccounts)
router.route('/transfer-bulk').post(transactionController.sendBulkPaymentRequest)
router.route('/accept').post(transactionController.acceptPaymentRequest)
router.route('/deny').post(transactionController.denyPaymentRequest)



module.exports = router;