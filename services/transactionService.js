const { v4 } = require('uuid');
const Transactions = require("../models/transactions");
const AppError = require('../utils/AppError');
const { transactionTypes, transactionSource, currency, charges } = require("../utils/constants");

const createCreditTransaction = async(options) => {
    try {
        const {account, source, beneficiaryName, beneficiaryAccountNumber,
        beneficiaryBank, reference = v4(), currency, amount, narration,
        vendorStatus, vendorReference, type} = options;
        
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
            vendorStatus, 
            vendorReference, 
            type
        }

        const transaction = await Transactions.create(txn);

        if (!transaction) {
            return (new AppError("Error creating transaction", 500))
        }

        account.balance = Number(account.balance) + Number(amount);
        await account.save();
        return transaction;
        
    } catch (error) {
        throw (error);
    }
}

const initDebitTransaction = async (options) => {
    try {
        const {account, source, beneficiaryName, beneficiaryAccountNumber, localAmount,
            beneficiaryBank, reference = v4(), currency, amount, reason} = options;
    
        // const charges = charges.EXTERNAL;
        const totalCost = charges.EXTERNAL + amount;
        if (Number(account.balance) < totalCost) {
            return (new AppError("Insufficient Funds", 400))
        }
        const newBalance = Number(account.balance) - Number(totalCost);
        const txn = { account: account._id, 
            source, 
            beneficiaryName, 
            beneficiaryAccountNumber,
            beneficiaryBank, 
            reference: v4(), 
            currency, 
            type: transactionTypes.DEBIT,
            amount, 
            localAmount,
            reference,
            charges: 0,
            balanceBefore: Number(account.balance),
            balanceAfter: newBalance,
            narration: reason,
        }

        return txn;
    } catch (error) {
        console.log(`Init DEbit txn Error: ${error}`)

        throw (error)
    }
}

const createDebitTransaction = async(data) => {
    try {


        const trans = data.txn;
        const account = data.account;

        console.log(`Debit Txn: ${JSON.stringify(data)}`)

        const transaction = await Transactions.create(trans);

        if (!transaction) {
            return (new AppError("Error creating transaction", 500))
        }
        const newBalance = Number(account.balance) - Number(trans.balanceAfter);

        account.balance = newBalance;

        await account.save();

        return transaction;
        
    } catch (error) {
        console.log(`Create DEbit txn Error: ${error}`)

        throw (error);
    }
}

module.exports = {
    createCreditTransaction,
    createDebitTransaction,
    initDebitTransaction,
}