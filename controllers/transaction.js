const { v4 } = require('uuid');
const csv = require("csv-parser");
const { Readable } = require("stream")
const Transactions = require("../models/transactions");
const AppError = require('../utils/AppError');
const { transactionTypes, transactionSource, currency, charges } = require("../utils/constants");
const { countryISOCode, countryCurrencyCode } = require("../utils/yellowCard");
const YellowcardService = require("../services/yellowCardService")
const { createCreditTransaction, createDebitTransaction, initDebitTransaction } = require("../services/transactionService");
const Accounts = require('../models/accounts');

exports.fetchSupportedCountries = async (req, res, next) => {
    try {
        res.status(200).json({
            status: 'success',
            data: countryISOCode,
        })
    } catch (error) {
        next(error)
    }
}
exports.fetchChannels = async (req, res, next) => {
    try {
        const payload = {
            country: req.query.country
        }

        const response = await YellowcardService.getAllChannels(payload);

        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        next(error)
    }
}

exports.fetchNetworks = async (req, res, next) => {
    try {
        const payload = {
            country: req.query.country
        }

        const response = await YellowcardService.getNetworks(payload);

        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        next(error)
    }
}

exports.fetchRates = async (req, res, next) => {
    try {
        const payload = {
            currency: req.query.currency
        }

        const response = await YellowcardService.getRates(payload);

        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        next(error)
    }
}

exports.fetchSystemAccounts = async (req, res, next) => {
    try {
        const response = await YellowcardService.getAccount();

        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        next(error)
    }
}

exports.accountLookup = async (req, res, next) => {
    try {
        console.log(` Account Details Lookup: ${JSON.stringify(req.body)}`);

        const payload = {
            accountNumber: req.body.accountNumber, 
            networkId: req.body.networkId,
            accountType: req.body.accountType,
            country: req.body.country,
            accountBank: req.body.bankCode
        }


        const response = await YellowcardService.resolveBankAccount(payload);

        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        next(error)
    }
}

async function processPayment(payload) {
    try{
        const localCurrency = payload.channel.currency;

        // let {data: channelData} = await YellowcardService.getAvailableChannels({
        //     country: payload.country
        // });
        // let {data: networkData} = await YellowcardService.getNetworks({
        //     country: payload.country
        // });
        let ratesData = await YellowcardService.getRates({
            currency: localCurrency
        });
        // let {channels, networks, rates} = {...networkData, ...channelData, ...ratesData}

        // Select channel
        let channel = payload.channel;
        // let supportedNetworks = networks.filter(n => n.status === 'active' && n.channelIds.includes(channel.id));
        let network = payload.network;
        
        const currency = ratesData.rates.filter(r => r.code === localCurrency)
        
        let amount, localAmount;

        if (payload.amount) {
            amount = payload.amount;
            localAmount = amount * currency[0].sell
        } else if (req.body.localAmount) {
            localAmount = payload.localAmount;
            amount = localAmount * currency[0].buy
        }else {
            return (new AppError("Provice either USD amount or local amount", 400))
        }

        const sender = {
            name: payload.user.name,
            country: payload.user.country,
            phone: payload.user.phoneNumber,
            address: payload.user.address,
            dob: payload.user.dob,
            email: payload.user.email,
            idNumber: payload.user.idNumber,
            idType: payload.user.idType
        }

        let accountLookup;
        // const accountLookup = await YellowcardService.resolveBankAccount({
        //     accountNumber: payload.accountNumber,
        //     networkId: network.id,
        //     accountType: network.accountNumberType
        // })

        const destination = {
            accountName: accountLookup && accountLookup.accountName ? 
                    accountLookup.accountName : payload.accountName,
            accountNumber: payload.accountNumber,
            accountType: network.accountNumberType,
            country: network.country,
            networkId: network.id,
            accountBank: network.code,
            networkName: network.name,
            phoneNumber: payload.phone ? payload.phone : null
          }

        const transactionOptions = {
            account: payload.account,
            source: payload.source ? payload.source : transactionSource.SYSTEM,
            beneficiaryName: accountLookup && accountLookup.accountName ? 
                    accountLookup.accountName : payload.accountName,
            beneficiaryAccountNumber: payload.accountNumber,
            beneficiaryBank: network.code, 
            currency: localCurrency, 
            amount, 
            localAmount,
            reason: payload.reason,
        }
        const txn = await initDebitTransaction(transactionOptions);

        let paymentRequest = {
            channelId: channel.id,
            // sequenceId: txn.reference,
            sequenceId: "123",
            // currency: channel.currency,
            // country: channel.country,
            amount: payload.amount,
            reason: payload.reason,
            customerType: payload.user.customerType,
            destination,
            sender,
            forceAccept: payload.user.role === "admin" ? true : false,
        }

        const response = await YellowcardService.submitPaymentRequest(paymentRequest);
            
        txn.vendorReference = response.id;
        txn.vendorCreatedAt = response.createdAt;
        txn.vendorUpdatedAt = response.updatedAt;
        txn.vendorStatus = response.status;
        txn.vendorConvertedAmount = response.convertedAmount;

        const transaction = await createDebitTransaction({
            account: payload.account,
            txn
        });

        return transaction;

    }catch(error) {
        console.log(`Payment Error: ${error}`)

        return new AppError(error, 500)
    }
}

exports.sendPaymentRequest = async (req, res, next) => {
    try {

        const payload = {
            ...req.body,
            account: req.account,
            user: req.user,
        }
        console.log(`Payment Payload: ${JSON.stringify(payload)}`)
        const transaction = await processPayment(payload);

        res.status(200).json({
            status: 'success',
            data: {
                transaction
            }
        })
    } catch (error) {
        next(error)
    }
}

exports.sendBulkPaymentRequest = async (req, res, next) => {
    try {
        // Read CSV file asynchronously
        const payments = [];
        const transactions = [];
        const failedTransactions = []

        // Read CSV data from request body
        const csvData = req.body.csvData;
        
        // Convert CSV data to a readable stream
        const csvStream = Readable.from(csvData.split('\n'));

        csvStream
            .pipe(csv())
            .on('data', (row) => {
                payments.push(row);
            })
            .on('error', (error) => {
                // Handle error while parsing CSV
                console.error('Error parsing CSV:' + error);
                return next('Error parsing CSV: ' + error);
            })
            .on('end', async () => {
                try {
                    for (const payment of payments) {

                        // csv fields: country, amount, localAmount, source, accountNumber
                        const payload = {
                            ...payments,
                            account: req.account,
                            user: req.user,
                        }

                        const transaction = await processPayment(payload);
                        transactions.push(transaction)
                    }
                
                } catch (error) {
                    console.error('Error processing Payment:' + error);

                    const paymentError = {
                        error,
                    }

                    failedTransactions.push(paymentError)
                }

                res.status(200).json({
                    status: 'success',
                    data: {
                        transactions,
                        failedTransactions
                    }
                });
            });
    } catch (error) {
        console.error('Error processing bulk Payment:' + error);

        next(error);
    }
}

exports.lookupPayment = async (req, res, next) => {
    try {
        const payload = {
            id: req.query.id
        }

        const response = await YellowcardService.lookupPayment(payload);

        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        next(error)
    }
}

exports.lookupPaymentBySequenceId = async (req, res, next) => {
    try {
        const payload = {
            sequenceId: req.query.sequenceId
        }

        const response = await YellowcardService.lookupPaymentBySequenceId(payload);

        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        next(error)
    }
}

exports.acceptPaymentRequest = async (req, res, next) => {
    try {
        const payload = {
            id: req.query.id
        }

        const response = await YellowcardService.acceptPaymentRequest(payload);

        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        next(error)
    }
}

exports.denyPaymentRequest = async (req, res, next) => {
    try {
        const payload = {
            id: req.query.id
        }

        const response = await YellowcardService.denyPaymentRequest(payload);

        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        next(error)
    }
}

exports.createWebhook = async (req, res, next) => {
    try {
        const payload = {
            url: req.body.url,
            state: req.body.state,
            active: req.body.active,
        }

        const response = await YellowcardService.createWebhook(payload);

        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        next(error)
    }
}

exports.updateWebhook = async (req, res, next) => {
    try {
        const payload = {
            id: req.body.id,
            url: req.body.url,
            state: req.body.state,
            active: req.body.active,
        }

        const response = await YellowcardService.updateWebhook(payload);

        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        next(error)
    }
}

exports.removeWebhook = async (req, res, next) => {
    try {
        const payload = {
            id: req.body.id,
        }

        const response = await YellowcardService.removeWebhook(payload);

        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        next(error)
    }
}

exports.listWebhooks = async (req, res, next) => {
    try {
        const response = await YellowcardService.listWebhooks();

        res.status(200).json({
            status: 'success',
            data: response
        })
    } catch (error) {
        next(error)
    }
}

exports.recievePaymentCompletedWebhook = async (req, res, next) => {
    try {
        // const {
        //     id, sequenceId, status, apiKey, event, executedAt
        // } = req.body;

        // if(status != "completed") {

        // }
        // const payment = await YellowcardService.lookupPayment({ id })

        // const account = await Accounts.findOne({accountNumber: payment.destination.accountNumber})
        // const transaction = {
        //     account,
        //     source: transactionSource.EXTERNAL,
        //     beneficiaryName: payment.sender.name,
        //     beneficiaryAccountNumber: payment.sender.
        // }
        
    } catch (error) {
        next(error)
    }
}