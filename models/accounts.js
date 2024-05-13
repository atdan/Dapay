const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: [true, "User must own an account"],
    index: true,
  },
  accountName: {
    type: String,
    required: [true, "Account name must be set"],
  },
  accountNumber: {
    type: Number,
    required: [true, "Account number must be set"],
  },
  currency: {
    type: String,
    default: "USD",
    required: [true, "Account currency must be set"],
  },
  balance: {
    type: mongoose.Schema.Types.Decimal128,
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
