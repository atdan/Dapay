const { v4 } = require('uuid');
const Transactions = require("../models/transactions");
const AppError = require('../utils/AppError');
const { transactionTypes, transactionSource, currency, charges } = require("../utils/constants");

const createCreditTransaction = async(options) => {
    try {
        const {account, source, beneficiaryName, beneficiaryAccountNumber,
        beneficiaryBank, reference = v4(), currency, amount, narration} = options;
        
        const txn = { account: account._id, 
            source, 
            beneficiaryName, 
            beneficiaryAccountNumber,
            beneficiaryBank, 
            reference: v4(), 
            currency, 
            amount, 
            narration,
            charges: 0,
            balanceBefore: Number(account.balance),
            balanceAfter: Number(account.balance) + Number(amount),
            narration,
        }

        const transaction = await Transactions.create(txn);

        if (!transaction) {
            return next(new AppError("Error creating transaction", 500))
        }

        return transaction;
        
    } catch (error) {
        next(error);
    }
}

const initDebitTransaction = async (options) => {
    try {
        const {account, source, beneficiaryName, beneficiaryAccountNumber, localAmount,
            beneficiaryBank, reference = v4(), currency, amount, reason} = options;
    
        const charges = source == transactionSource.INTERNAL ? charges.INTERNAL : charges.EXTERNAL;
        const totalCost = charges + amount;
        if (Number(account.balance) < totalCost) {
            return next(new AppError("Insufficient Funds", 400))
        }
        const newBalance = Number(account.balance) - Number(totalCost);
        const txn = { account: account._id, 
            source, 
            beneficiaryName, 
            beneficiaryAccountNumber,
            beneficiaryBank, 
            reference: v4(), 
            currency, 
            amount, 
            localAmount,
            reason,
            reference,
            charges,
            balanceBefore: Number(account.balance),
            balanceAfter: newBalance,
            narration,
        }

        return txn;
    } catch (error) {
        next(error)
    }
}

const createDebitTransaction = async(data) => {
    try {

        const transaction = await Transactions.create(data.txn);

        if (!transaction) {
            return next(new AppError("Error creating transaction", 500))
        }
        const totalCost = charges + amount;
        const newBalance = Number(account.balance) - Number(totalCost);

        data.account.balance = newBalance;

        await account.save();

        return transaction;
        
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createCreditTransaction,
    createDebitTransaction,
    initDebitTransaction,
}