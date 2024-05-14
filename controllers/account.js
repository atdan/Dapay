const { v4 } = require('uuid');
const Accounts = require("../models/accounts");
const AppError = require('../utils/AppError');
const {createCreditTransaction, createDebitTransaction} = require("../services/transactionService");
const { transactionTypes } = require('../utils/constants');

const fetchUserAccounts = async(req, res, next) => {
    try {

        if (req.account) {
            res.status(200).json({
                status: "success",
                data: {
                  account: req.account,
                },
            });
        }else {
            const account = await Accounts.find({ user : req.user._id });

            if (!account) {
                return next(new AppError("Error fetching user accounts", 400))
            }
    
            res.status(200).json({
                status: "success",
                data: {
                  account,
                },
            });
        }
    } catch (error) {
        next(error);
    }
}

const creditAccount = async(req, res, next) => {
    try {
        const { amount, currency, source, narration,
            beneficiaryName, beneficiaryAccountNumber,
            beneficiaryBank } = req.body;

        const account = await Accounts.findOne({
            user: req.user._id,
            currency: currency ? currency : "USD"
        });

        if (!account) {
            return next(new AppError("Account does not exist", 404))
        }

        const txnOptions = {account, 
            source, 
            beneficiaryName, 
            beneficiaryAccountNumber,
            beneficiaryBank, 
            currency, 
            amount, 
            narration}

        const transaction = await createCreditTransaction(txnOptions);

        if(!transaction) {
            return next(new AppError("Transaction Failed", 500))
        }

        
    } catch (error) {
        next(error);
    }
}

const creditClientAccount = async(req, res, next) => {
    try {
        const { clientId, amount, currency, source, narration,
            beneficiaryName, beneficiaryAccountNumber,
            beneficiaryBank } = req.body;

        const account = await Accounts.findOne({
            user: clientId,
            currency: currency ? currency : "USD"
        });

        if (!account) {
            return next(new AppError("Account does not exist", 404))
        }

        const txnOptions = {account, 
            source: source ? source : 'system', 
            beneficiaryName: beneficiaryName ? beneficiaryName : "System", 
            beneficiaryAccountNumber: beneficiaryAccountNumber ? beneficiaryAccountNumber : "0000000001",
            beneficiaryBank: beneficiaryBank ? beneficiaryBank : "Dapay", 
            currency, 
            amount, 
            narration,
            vendorStatus: "completed",
            vendorReference: v4(),
            type: transactionTypes.CREDIT
        }

        const transaction = await createCreditTransaction(txnOptions);

        if(!transaction) {
            return next(new AppError("Transaction Failed", 500))
        }

        return res.status(200).json({
            status: "success",
            data: {
              transaction,
            },
        });;
        
    } catch (error) {
        next(error);
    }
}

const debitAccount = async(req, res, next) => {
    try {
        const { amount, currency, source, narration,
            beneficiaryName, beneficiaryAccountNumber,
            beneficiaryBank } = req.body;

        const account = await Accounts.findOne({
            user: req.user._id,
            currency
        });

        if (!account) {
            return next(new AppError("Account does not exist", 404))
        }

        const txnOptions = { account, 
            source, 
            beneficiaryName, 
            beneficiaryAccountNumber,
            beneficiaryBank, 
            currency, 
            amount, 
            narration}

        const transaction = await createDebitTransaction(txnOptions);

        if(!transaction) {
            return next(new AppError("Transaction Failed", 500))
        }

        
    } catch (error) {
        next(error);
    }
}

module.exports = {
    fetchUserAccounts,
    creditClientAccount
}