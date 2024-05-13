const mongoose = require("mongoose");
const { currency } = require("../utils/constants");

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: [true, "User must own an account"],
    index: true,
  },
  accountNumber: {
    type: Number,
    required: [true, "Account number must be set"],
    index: true.valueOf,
  },
  currency: {
    type: String,
    enum: [currency.NGN, currency.USD],
    required: [true, "Account currency must be set"],
  },
  balance: {
    type: mongoose.Schema.Types.Decimal128,
    required: [true, "Account balance must be set"],
    default: 0,
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

const Accounts = mongoose.model("Accounts", accountSchema);

module.exports = Accounts;
