const crypto = require('crypto-js')
const axios = require('axios')

const config = require('../config')


/**
 * contains Helper Methods for yellowCard
 * @class YellowCardHelper
 */
class YellowCardHelper {

  static endpoints = {
    GET_CHANNELS: {
      url : config.ycBaseUrl + "/channels",
      method: "GET"
    },
    GET_NETWORKS: {
      url : config.ycBaseUrl + "/networks",
      method: "GET"
    },
    GET_RATES: {
      url : config.ycBaseUrl + "/rates",
      method: "GET"
    },
    GET_ACCOUNTS: {
      url : config.ycBaseUrl + "/accounts",
      method: "GET"
    },
    RESOLVE_BANK_ACCOUNT: {
      url : config.ycBaseUrl + "/details",
      method: "POST"
    },
    SUBMIT_PAYMENT_REQUEST: {
      url : config.ycBaseUrl + "/payments",
      method: "POST"
    },
    ACCEPT_PAYMENT_REQUEST: {
      url : config.ycBaseUrl + "/payments",
      method: "POST"
    },
    DENY_PAYMENT_REQUEST: {
      url : config.ycBaseUrl + "/payments",
      method: "POST"
    },
    LOOKUP_PAYMENT: {
      url : config.ycBaseUrl + "/payments",
      method: "GET"
    },
    LOOKUP_PAYMENT_BY_SEQUENCE_ID: {
      url : config.ycBaseUrl + "/payments/sequence-id",
      method: "GET"
    },
  }
  
  static countryISOCode = {
    Botswana: "BW",
    Cameroon: "CM",
    Congo_Brazzaville: "CD",
    Gabon: "GA",
    Ghana: "GH",
    Kenya: "KE",
    Malawi: "MW",
    Nigeria: "NG",
    Rwanda: "RW",
    South_Africa: "ZA",
    Tanzania: "TZ",
    Uganda: "UG",
    Zambia: "ZM"
  }

  static getCountryKey(country) {
    // Find the key by value
    const countryCode = Object.entries(this.countryISOCode).find(
      ([key, value]) => value === country
    );
    return countryCode ? countryCode[0] : null; // Return the key
  }
  static countryCurrencyISOCode = {
    BW: "BWP",
    CM: "XAF",
    CD: "XAF",
    GA: "XAF",
    GH: "GHS",
    KE: "KES",
    MW: "MWK",
    NG: "NGN",
    RW: "RWF",
    ZA: "ZAR",
    TZ: "TZS",
    UG: "UGX",
    ZM: "ZMW"
  };

  static getCurrencyCode(country) {
    return this.countryCurrencyCode[country] || null;
  }


  /**
   * @static
   * @memberof YellowCardValidationHelper
   * @param {object} data - Object tp be stringified
   * @returns {string} the strigified data
   */
  static stringify (data) {
    return JSON.stringify(data)
  }

  static buildHeader(body) {
    const date = new Date().toISOString();
    const hmac = crypto.algo.HMAC.create(crypto.algo.SHA256, config.apiSecret);

    hmac.update(date, 'utf8')
    hmac.update(path, 'utf8')
    hmac.update(method, 'utf8')

    if(body) {
      let bodyHmac = crypto.SHA256(JSON.stringify(body)).toString(crypto.enc.Base64)
      hmac.update(bodyHmac)
    }

    const hash = hmac.finalize();
    const signature = crypto.enc.Base64.stringify(hash)


    return {
      accept: 'application/json',
      "X-YC-Timestamp": date,
      "Authorization": `YcHmacV1 ${config.apiKey}:${signature}`
    }
  }
}

module.exports = YellowCardHelper