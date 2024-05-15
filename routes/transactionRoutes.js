const express = require('express');
const transactionController = require('./../controllers/transaction')
const authController = require('../controllers/authController');
const { lockTransaction } = require('../services/cache');
const multer = require('multer');

const router = express.Router();


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.use(authController.protect)

router.get('/countries', transactionController.fetchSupportedCountries)
router.get('/channels', transactionController.fetchChannels)
router.get('/networks', transactionController.fetchNetworks)
router.get('/rates', transactionController.fetchRates)
router.get('/supported-countries', transactionController.fetchSupportedCountries)
router.post('/account-lookup', transactionController.accountLookup)
router.route('/transfer').post(lockTransaction, transactionController.sendPaymentRequest)
router.get('/payment-lookup', transactionController.lookupPayment)
router.get('/payment-lookup-sq', transactionController.lookupPaymentBySequenceId)


// Only available for admin and system
router.use(authController.restrictTo("admin", "system"))
router.route('/transfer-bulk').post( upload.single('csvFile'), transactionController.sendBulkPaymentRequest)
router.route('/accept').post(transactionController.acceptPaymentRequest)
router.route('/deny').post(transactionController.denyPaymentRequest)

router.route('/webhook').post(transactionController.createWebhook)
router.route('/webhook').put(transactionController.updateWebhook)
router.route('/webhook').delete(transactionController.removeWebhook)
router.route('/webhook').get(transactionController.listWebhooks)



module.exports = router;