const { v4 } = require('uuid');
const csv = require("csv-parser");
const Transactions = require("../models/transactions");
const AppError = require('../utils/AppError');
const { transactionTypes, transactionSource, currency, charges } = require("../utils/constants");
const { countryISOCode, countryCurrencyCode } = require("../utils/yellowCard");
const YellowcardService = require("../services/yellowCardService")
const { createCreditTransaction, createDebitTransaction, initDebitTransaction } = require("../services/transactionService")

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

exports.fetchAccounts = async (req, res, next) => {
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
        const payload = {
            accountNumber: req.body.account, 
            networkId: req.body.networkId,
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

exports.sendPaymentRequest = async (req, res, next) => {
    try {

        const localCurrency = countryCurrencyCode(req.query.country);

        let {data: channelData} = await YellowcardService.getAvailableChannels({
            country: req.query.country
        });
        let {data: networkData} = await YellowcardService.getNetworks({
            country: req.query.country
        });
        let {rates: ratesData} = await YellowcardService.getRates({
            currency: localCurrency
        });
        let {channels, networks, rates} = {...networkData, ...channelData, ...ratesData}

        // Select channel
        let channel = channels[1]
        let supportedNetworks = networks.filter(n => n.status === 'active' && n.channelIds.includes(channel.id));
        let network = supportedNetworks[0]
        
        const currency = rates.filter(r => r.code === localCurrency)
        
        let amount, localAmount;

        if (req.body.amount) {
            amount = req.body.amount;
            localAmount = amount * currency[0].sell
        } else if (req.body.localAmount) {
            localAmount = req.body.localAmount;
            amount = localAmount * currency[0].buy
        }else {
            next(new AppError("Provice either USD amount or local amount", 400))
        }

        const sender = {
            name: req.user.name,
            country: req.user.country,
            phone: req.user.phoneNumber,
            address: req.user.address,
            dob: req.user.dob,
            email: req.user.email,
            idNumber: req.user.idNumber,
            idType: req.user.idType
        }

        const accountLookup = await YellowcardService.resolveBankAccount({
            accountNumber: req.body.accountNumber,
            networkId: network.id,
            accountType: network.accountNumberType
        })

        const destination = {
            accountName: accountLookup.accountName,
            accountNumber: req.body.accountNumber,
            accountType: network.accountNumberType,
            country: network.country,
            networkId: network.id,
            accountBank: network.code
          }

        const transactionOptions = {
            account: req.account,
            source: req.body.source,
            beneficiaryName: accountLookup.accountName,
            beneficiaryAccountNumber: req.body.accountNumber,
            beneficiaryBank: network.code, 
            currency, 
            amount, 
            localAmount,
            reason: req.body.reason,
        }
        const txn = await initDebitTransaction(transactionOptions);

        let paymentRequest = {
            channelId: channel.id,
            sequenceId: txn.reference,
            currency: channel.currency,
            country: channel.country,
            amountUSD: req.body.amount,
            reason: req.body.reason,
            destination,
            sender,
            forceAccept: true,
        }

        const response = await YellowcardService.submitPaymentRequest(paymentRequest);
        
        txn.vendorReference = response.id;
        txn.vendorCreatedAt = response.createdAt;
        txn.vendorUpdatedAt = response.updatedAt;
        txn.vendorStatus = response.status;
        txn.vendorConvertedAmount = response.convertedAmount;

        const transaction = await createDebitTransaction({
            account,
            txn
        });


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
        fs.createReadStream('payments.csv')
            .pipe(csv())
            .on('data', (row) => {
                payments.push(row);
            })
            .on('end', async () => {
                try {
                    for (const payment of payments) {
                        const localCurrency = countryCurrencyCode(payment.country);
    
                        let {data: channelData} = await YellowcardService.getAvailableChannels({
                            country: payment.country
                        });
                        let {data: networkData} = await YellowcardService.getNetworks({
                            country: payment.country
                        });
                        let {rates: ratesData} = await YellowcardService.getRates({
                            currency: localCurrency
                        });
                        let {channels, networks, rates} = {...networkData, ...channelData, ...ratesData}
                
                        // Select channel
                        let channel = channels[1]
                        let supportedNetworks = networks.filter(n => n.status === 'active' && n.channelIds.includes(channel.id));
                        let network = supportedNetworks[0]
                        
                        const currency = rates.filter(r => r.code === localCurrency)
                        
                        let amount, localAmount;
                
                        if (payment.amount) {
                            amount = payment.amount;
                            localAmount = amount * currency[0].sell
                        } else if (payment.localAmount) {
                            localAmount = payment.localAmount;
                            amount = localAmount * currency[0].buy
                        }else {
                            next(new AppError("Provide either USD amount or local amount", 400))
                        }
                
                        const sender = {
                            name: payment.name,
                            country: payment.senderCountry,
                            phone: payment.phone,
                            address: payment.address,
                            dob: payment.dob,
                            email: payment.email,
                            idNumber: payment.idNumber,
                            idType: payment.idType
                        }
                
                        const accountLookup = await YellowcardService.resolveBankAccount({
                            accountNumber: payment.accountNumber,
                            networkId: network.id,
                            accountType: network.accountNumberType
                        })
                
                        const destination = {
                            accountName: accountLookup.accountName,
                            accountNumber: payment.accountNumber,
                            accountType: network.accountNumberType,
                            country: network.country,
                            networkId: network.id,
                            accountBank: network.code
                          }
                
                        const transactionOptions = {
                            account: req.account,
                            source: payment.source,
                            beneficiaryName: accountLookup.accountName,
                            beneficiaryAccountNumber: payment.accountNumber,
                            beneficiaryBank: network.code, 
                            currency, 
                            amount, 
                            localAmount,
                            reason: payment.reason,
                        }
                        const txn = await initDebitTransaction(transactionOptions);
                
                        let paymentRequest = {
                            channelId: channel.id,
                            sequenceId: txn.reference,
                            currency: channel.currency,
                            country: channel.country,
                            amountUSD: payment.amount,
                            reason: payment.reason,
                            destination,
                            sender,
                            forceAccept: true,
                        }
                
                        const response = await YellowcardService.submitPaymentRequest(paymentRequest);
                        
                        txn.vendorReference = response.id;
                        txn.vendorCreatedAt = response.createdAt;
                        txn.vendorUpdatedAt = response.updatedAt;
                        txn.vendorStatus = response.status;
                        txn.vendorConvertedAmount = response.convertedAmount;
                
                        const transaction = await createDebitTransaction({
                            account,
                            txn
                        });
                    }
                
                    res.status(200).json({
                        status: 'success',
                        data: {
                            transactions
                        }
                    });
                } catch (error) {
                    next(error);
                }
            });
    } catch (error) {
        next(error);
    }
}