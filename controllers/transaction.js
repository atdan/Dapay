const { v4 } = require('uuid');
const csv = require("csv-parser");
const { Readable } = require("stream")
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

async function processPayment(payload) {
    try{
        const localCurrency = countryCurrencyCode(payload.country);

        let {data: channelData} = await YellowcardService.getAvailableChannels({
            country: payload.country
        });
        let {data: networkData} = await YellowcardService.getNetworks({
            country: payload.country
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

        const accountLookup = await YellowcardService.resolveBankAccount({
            accountNumber: payload.accountNumber,
            networkId: network.id,
            accountType: network.accountNumberType
        })

        const destination = {
            accountName: accountLookup.accountName,
            accountNumber: payload.accountNumber,
            accountType: network.accountNumberType,
            country: network.country,
            networkId: network.id,
            accountBank: network.code
          }

        const transactionOptions = {
            account: payload.account,
            source: payload.source,
            beneficiaryName: accountLookup.accountName,
            beneficiaryAccountNumber: payload.accountNumber,
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
            amountUSD: payload.amount,
            reason: payload.reason,
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

        return transaction;

    }catch(error) {
        return new AppError(error)
    }
}

exports.sendPaymentRequest = async (req, res, next) => {
    try {

        const payload = {
            ...req.body,
            country: req.query.country,
            account: req.account,
            user: req.user,
        }
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

                        // csv fielsd: country, amount, localAmount, source, accountNumber
                        const payload = {
                            ...payments,
                            account: req.account,
                            user: req.user,
                        }

                        const transaction = await processPayment(payload);
                        transactions.push(transaction)
                    }
                
                    res.status(200).json({
                        status: 'success',
                        data: transactions
                    });

                } catch (error) {
                    next(error);
                }
            });
    } catch (error) {
        next(error);
    }
}