const Accounts = require("../models/accounts");
const AppError = require('../utils/AppError');
const {createCreditTransaction, createDebitTransaction} = require("./transaction")

const fetchUserAccounts = async(req, res, next) => {
    try {

        if (req.account) {
            return req.account;
        }else {
            const accounts = await Accounts.find({ user : req.user._id });

            if (!accounts) {
                return next(new AppError("Error fetching user accounts", 400))
            }
    
            res.status(200).json({
                status: "success",
                data: {
                  accounts,
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
            narration}

        const transaction = await createCreditTransaction(txnOptions);

        if(!transaction) {
            return next(new AppError("Transaction Failed", 500))
        }

        return transaction;
        
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