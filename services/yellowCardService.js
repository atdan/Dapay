const axios = require('axios')
const config = require('../config');
const AppError = require("../utils/AppError")
const YellowCardHelper = require("../utils/yellowCard");
const { cacheData, retrieveCachedData } = require('./cache');


class YellowCardService {
    
  static async getAllChannels(data) {
    try {
        const queryParam = {
            country: data.country
        }

        const cachedData = retrieveCachedData("Channels", data.country);

        if (cachedData) {
            return cachedData;
        } else {
            const options = {
                method: YellowCardHelper.endpoints.GET_CHANNELS.method,
                headers: YellowCardHelper.buildHeader(),
                params: queryParam
            }

            const response = await axios.get(YellowCardHelper.endpoints.GET_CHANNELS.url, options);

            if (!response) {
                return new AppError("Request failed", 500);
            }
    
            if (response.status != 200) {
                return new AppError(response.data.message ? 
                    response.data.message : "Request Failed",
                    response.data.code ? 
                    response.data.code : 500)
            }
    
            cacheData("Channels", data.country, response.data, 120)
            return response.data;
        }

    } catch (error) {
        return new AppError(error);
    }
  }

  static async getAvailableChannels(data) {
    try {
        const queryParam = {
            country: data.country
        }

        const cachedData = retrieveCachedData("ActiveChannels", data.country);

        if (cachedData) {
            return cachedData;
        } else {
            const options = {
                method: YellowCardHelper.endpoints.GET_CHANNELS.method,
                headers: YellowCardHelper.buildHeader(),
                params: queryParam
            }
    
            const response = await axios.get(YellowCardHelper.endpoints.GET_CHANNELS.url, options);
    
            if (!response) {
                return new AppError("Request failed", 500);
            }
    
            if (response.status != 200) {
                return new AppError(response.data.message ? 
                    response.data.message : "Request Failed",
                    response.data.code ? 
                    response.data.code : 500)
            }
    
            let activeChannels = response.data.filter(c => c.status === 'active')
    
            cacheData("ActiveChannels", data.country, response.data, 120)
            return activeChannels;
        }
        
    } catch (error) {
        return new AppError(error, 500);
    }
  }

  static async getNetworks(data) {
    try {
        const queryParam = {
            country: data.country
        }

        const cachedData = retrieveCachedData("Networks", data.country);

        if (cachedData) {
            return cachedData;
        } else {

            const options = {
                method: YellowCardHelper.endpoints.GET_NETWORKS.method,
                headers: YellowCardHelper.buildHeader(),
                params: queryParam
            }
    
            const response = await axios.get(YellowCardHelper.endpoints.GET_NETWORKS.url, options);
    
            if (!response) {
                return new AppError("Request failed", 500);
            }
    
            if (response.status != 200) {
                return new AppError(response.data.message ? 
                    response.data.message : "Request Failed",
                    response.data.code ? 
                    response.data.code : 500)
            }

            cacheData("Networks", data.country, response.data, 120)

            return response.data;
        }

    } catch (error) {
        return new AppError(error, 500);
    }
  }

  static async getRates(data) {
    try {
        const queryParam = {
            currency: data.currency
        }

        const cachedData = retrieveCachedData("Rates", data.currency);

        if (cachedData) {
            return cachedData;
        } else {
            const options = {
                method: YellowCardHelper.endpoints.GET_RATES.method,
                headers: YellowCardHelper.buildHeader(),
                params: queryParam
            }
    
            const response = await axios.get(YellowCardHelper.endpoints.GET_RATES.url, options);
    
            if (!response) {
                return new AppError("Request failed", 500);
            }
    
            if (response.status != 200) {
                return new AppError(response.data.message ? 
                    response.data.message : "Request Failed",
                    response.data.code ? 
                    response.data.code : 500)
            }
            cacheData("Rates", data.currency, response.data, 60)

            return response.data;
        }

    } catch (error) {
        return new AppError(error, 500);
    }
  }

  static async getAccount() {
    try {
        const options = {
            method: YellowCardHelper.endpoints.GET_ACCOUNTS.method,
            headers: YellowCardHelper.buildHeader(),
        }

        const response = await axios.get(YellowCardHelper.endpoints.GET_ACCOUNTS.url, options);

        if (!response) {
            return new AppError("Request failed", 500);
        }

        if (response.status != 200) {
            return new AppError(response.data.message ? 
                response.data.message : "Request Failed",
                response.data.code ? 
                response.data.code : 500)
        }
        return response.data;

    } catch (error) {
        return new AppError(error, 500);
    }
  }


    /**
   * It validates account number
   * @static
   * @param {object} data - {accountNumber, networkId, accountType}
   * @returns {object} - account details
   */  
  static async resolveBankAccount(data) {
    try {

        const options = {
            method: YellowCardHelper.endpoints.RESOLVE_BANK_ACCOUNT.method,
            headers: YellowCardHelper.buildHeader(data),
        }

        const response = await axios.get(YellowCardHelper.endpoints.RESOLVE_BANK_ACCOUNT.url + `/${accountType}`, options);

        if (!response) {
            return new AppError("Request failed", 500);
        }

        if (response.status != 200) {
            return new AppError(response.data.message ? 
                response.data.message : "Request Failed",
                response.data.code ? 
                response.data.code : 500)
        }
        return response.data;

    } catch (error) {
        return new AppError(error, 500);
    }
  }

   /**
   * Submit a disbursement payment request. 
   * This will lock in a rate and await approval.
   * @static
   * @param {object} data - {channelId, sequenceId, amount, reason,
   *        sender, destination, forceAccept, customerType}
   * @returns {object} - account details
   */  
   static async submitPaymentRequest(data) {
    try {

        const options = {
            method: YellowCardHelper.endpoints.SUBMIT_PAYMENT_REQUEST.method,
            headers: YellowCardHelper.buildHeader(data),
        }

        const response = await axios.get(YellowCardHelper.endpoints.SUBMIT_PAYMENT_REQUEST.url, options);

        if (!response) {
            return new AppError("Request failed", 500);
        }

        if (response.status != 200) {
            return new AppError(response.data.message ? 
                response.data.message : "Request Failed",
                response.data.code ? 
                response.data.code : 500)
        }
        return response.data;

    } catch (error) {
        return new AppError(error, 500);
    }
  }

  static async lookupPayment(data) {
    try {

        const cachedData = retrieveCachedData("LookupPayment", data.id);

        if (cachedData) {
            return cachedData;
        } else {
            const options = {
                method: YellowCardHelper.endpoints.LOOKUP_PAYMENT.method,
                headers: YellowCardHelper.buildHeader(),
            }
    
            const response = await axios.get(YellowCardHelper.endpoints.LOOKUP_PAYMENT.url + `/${data.id}`, options);
    
            if (!response) {
                return new AppError("Request failed", 500);
            }
    
            if (response.status != 200) {
                return new AppError(response.data.message ? 
                    response.data.message : "Request Failed",
                    response.data.code ? 
                    response.data.code : 500)
            }

            cacheData("LookupPayment", data.id, response.data, 600)

            return response.data;

        }
        

    } catch (error) {
        return new AppError(error, 500);
    }
}

    static async lookupPaymentBySequenceId(data) {
        try {
            const options = {
                method: YellowCardHelper.endpoints.LOOKUP_PAYMENT.method,
                headers: YellowCardHelper.buildHeader(),
            }
    
            const response = await axios.get(YellowCardHelper.endpoints.LOOKUP_PAYMENT.url + `/sequence-id/${data.sequenceId}`, options);
    
            if (!response) {
                return new AppError("Request failed", 500);
            }
    
            if (response.status != 200) {
                return new AppError(response.data.message ? 
                    response.data.message : "Request Failed",
                    response.data.code ? 
                    response.data.code : 500)
            }
            return response.data;
    
        } catch (error) {
            return new AppError(error, 500);
        }
  }

  static async acceptPaymentRequest(data) {
    try {  

        const options = {
            method: YellowCardHelper.endpoints.ACCEPT_PAYMENT_REQUEST.method,
            headers: YellowCardHelper.buildHeader(),
        }

        const response = await axios.get(YellowCardHelper.endpoints.ACCEPT_PAYMENT_REQUEST.url + `/${data.id}/accept`, options);

        if (!response) {
            return new AppError("Request failed", 500);
        }

        if (response.status != 200) {
            return new AppError(response.data.message ? 
                response.data.message : "Request Failed",
                response.data.code ? 
                response.data.code : 500)
        }


        return response.data;

    } catch (error) {
        return new AppError(error, 500);
    }
  }

  static async denyPaymentRequest(data) {
    try {  

        const options = {
            method: YellowCardHelper.endpoints.ACCEPT_PAYMENT_REQUEST.method,
            headers: YellowCardHelper.buildHeader(),
        }

        const response = await axios.get(YellowCardHelper.endpoints.ACCEPT_PAYMENT_REQUEST.url + `/${data.id}/deny  `, options);

        if (!response) {
            return new AppError("Request failed", 500);
        }

        if (response.status != 200) {
            return new AppError(response.data.message ? 
                response.data.message : "Request Failed",
                response.data.code ? 
                response.data.code : 500)
        }


        return response.data;

    } catch (error) {
        return new AppError(error, 500);
    }
  }
}

module.exports = YellowCardService;