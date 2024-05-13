const mongoose = require("mongoose");
const { transactionTypes, transactionSource, currency } = require("../utils/constants");

const transactionSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Accounts',
    required: [true, "Transaction sent from invalid account"],
  },
  type: {
    type: String,
    enum: [transactionTypes.DEBIT, transactionTypes.CREDIT],
    required: [true, "Transaction type must be set"],
  },
  source: {
    type: String,
    enum: [transactionSource.INTERNAL, transactionSource.EXTERNAL],
    required: [true, "Transaction source must be set"],
  },
  beneficiaryName: {
    type: String,
    required: [true, "Beneficiary name not set"],
  },
  beneficiaryAccountNumber: {
    type: Number,
    required: [true, "Beneficiary account number not set"],
  },
  beneficiaryBank: {
    type: String,
    required: [true, "Beneficiary bank not set"],
  },
  reference: {
    type: String,
    required: [true, "Transaction reference not set"],
  },
  currency: {
    type: String,
    enum: [currency.NGN, currency.USD],
    required: [true, "Transaction currency must be set"],
  },
  amount: {
    type: mongoose.Schema.Types.Decimal128,
    required: [true, "USD Transaction amount not set"],
  },
  localAmount: {
    type: mongoose.Schema.Types.Decimal128,
    required: [true, "Local Transaction amount not set"],
  },
  charges: {
    type: mongoose.Schema.Types.Decimal128,
    required: [true, "Transaction charges not set"],
  },
  balanceBefore: {
    type: mongoose.Schema.Types.Decimal128,
    required: [true, "Account balance before transaction not set"],
  },
  balanceAfter: {
    type: mongoose.Schema.Types.Decimal128,
    required: [true, "Account balance after transaction not set"],
  },
  narration: {
    type: String,
  },
  vendorReference: {
    type: String,
    required: true,
  },
  vendorCreatedAt: {
    type: String,
  },
  vendorUpdatedAt: {
    type: String,
  },
  vendorExpiresAt: {
    type: String,
  },
  vendorStatus: {
    type: String,
    required: true,
  },
  vendorConvertedAmount: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  updatedAt: {
    type: Date,
    default: Date.now()
  },
});

const Transactions = mongoose.model("Transactions", transactionSchema);

module.exports = Transactions;
