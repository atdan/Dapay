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
            console.log("No cached Data");

            const path = YellowCardHelper.endpoints.GET_CHANNELS.path
            const method = YellowCardHelper.endpoints.GET_CHANNELS.method
            const url = YellowCardHelper.endpoints.GET_CHANNELS.url;

            const options = {
                url,
                method,
                headers: YellowCardHelper.buildHeader(null, path, method),
                params: queryParam
            }

            console.log(`Yellow Card Options: ${JSON.stringify(options)}`)

            const response = await axios(options);

            console.log(`Request response: ${response}`)
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
        console.log(` Yellowcard Request Error: ${error}`)
        return new AppError(error.mmessage ? error.message : 
            error, error.status ? error.status : 500);
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
            const path = YellowCardHelper.endpoints.GET_CHANNELS.path
            const method = YellowCardHelper.endpoints.GET_CHANNELS.method

            const options = {
                method,
                headers: YellowCardHelper.buildHeader(null, path, method),
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
            const path = YellowCardHelper.endpoints.GET_NETWORKS.path
            const method = YellowCardHelper.endpoints.GET_NETWORKS.method

            const options = {
                method,
                headers: YellowCardHelper.buildHeader(null, path, method),
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

            // let supportedNetworks = response.data.filter(n => n.status === 'active');

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
            const path = YellowCardHelper.endpoints.GET_RATES.path
            const method = YellowCardHelper.endpoints.GET_RATES.method

            const options = {
                method,
                headers: YellowCardHelper.buildHeader(null, path, method),
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
        console.log(`Rates Error: ${error}`)
        return new AppError(error, 500);
    }
  }

  static async getAccount() {
    try {
        const path = YellowCardHelper.endpoints.GET_ACCOUNTS.path
        const method = YellowCardHelper.endpoints.GET_ACCOUNTS.method

        console.log(`Fetching Account Details`);

        const options = {
            method,
            headers: YellowCardHelper.buildHeader(null, path, method),
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

        console.log(` Account resolveBankAccount: ${data}`);

        const path = YellowCardHelper.endpoints.RESOLVE_BANK_ACCOUNT.path
        const method = YellowCardHelper.endpoints.RESOLVE_BANK_ACCOUNT.method

        const accountType = data.accountType;
        delete data.accountType;
        const options = {
            url: YellowCardHelper.endpoints.RESOLVE_BANK_ACCOUNT.url  + `/${accountType}`,
            method,
            headers: YellowCardHelper.buildHeader(data, path + accountType, method),
            body: data,
        }

        console.log(` resolveBankAccount options: ${JSON.stringify(options)}`);

        const response = await axios(options);

        if (!response) {
            console.log(`No response resolveBankAccount`);

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
        console.log(`Error resolveBankAccount: ${error}`);

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


        const path = YellowCardHelper.endpoints.SUBMIT_PAYMENT_REQUEST.path
        const method = YellowCardHelper.endpoints.SUBMIT_PAYMENT_REQUEST.method

        const options = {
            url: YellowCardHelper.endpoints.SUBMIT_PAYMENT_REQUEST.url,
            method,
            headers: YellowCardHelper.buildHeader(data, path, method),
            data,
        }

        console.log(`Submit payment payload: ${JSON.stringify(options)}`);

        const response = await axios(options);

        console.log(`Submit payment response 1 : ${response}`);

        if (!response) {
            console.log(`Submit payment no respnse`);

            throw new AppError("Request failed", 500);
        }

        console.log(`Submit payment response: ${response}`);

        if (response.status != 200) {
            throw new AppError(response.data.message ? 
                response.data.message : "Request Failed",
                response.data.code ? 
                response.data.code : 500)
        }

        console.log(`Transaction response: ${response.data}`)

        return response.data;

    } catch (error) {
        console.log(`Submit payment error: ${error}`);

        return new AppError(error, 500);
    }
  }

  static async lookupPayment(data) {
    try {

        const cachedData = retrieveCachedData("LookupPayment", data.id);

        if (cachedData) {
            return cachedData;
        } else {
            const path = YellowCardHelper.endpoints.LOOKUP_PAYMENT.path
            const method = YellowCardHelper.endpoints.LOOKUP_PAYMENT.method

            const options = {
                method,
                headers: YellowCardHelper.buildHeader(null, path, method),
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
            const path = YellowCardHelper.endpoints.LOOKUP_PAYMENT_BY_SEQUENCE_ID.path
            const method = YellowCardHelper.endpoints.LOOKUP_PAYMENT_BY_SEQUENCE_ID.method

            const options = {
                method,
                headers: YellowCardHelper.buildHeader(null, path, method),
            }
    
            const response = await axios.get(YellowCardHelper.endpoints.LOOKUP_PAYMENT_BY_SEQUENCE_ID.url + `/sequence-id/${data.sequenceId}`, options);
    
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

        const path = YellowCardHelper.endpoints.ACCEPT_PAYMENT_REQUEST.path
        const method = YellowCardHelper.endpoints.ACCEPT_PAYMENT_REQUEST.method
        const options = {
            url: YellowCardHelper.endpoints.ACCEPT_PAYMENT_REQUEST.url + `/${data.id}/accept`,
            method,
            headers: YellowCardHelper.buildHeader(null, path, method),
        }

        const response = await axios(options);

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
        const path = YellowCardHelper.endpoints.DENY_PAYMENT_REQUEST.path
        const method = YellowCardHelper.endpoints.DENY_PAYMENT_REQUEST.method

        const options = {
            url: YellowCardHelper.endpoints.DENY_PAYMENT_REQUEST.url + `/${data.id}/deny`,
            method,
            headers: YellowCardHelper.buildHeader(null, path, method),
        }

        const response = await axios(options);

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
   * Create webhook
   * @static
   * @param {object} data - {url, state, active=true}
   *        state = payment.complete
   * @returns {object} - account details
   */  
  static async createWebhook(data) {
    try {  

        const path = YellowCardHelper.endpoints.CREATE_WEBHOOK.path
        const method = YellowCardHelper.endpoints.CREATE_WEBHOOK.method

        const options = {
            url: YellowCardHelper.endpoints.CREATE_WEBHOOK.url,
            method,
            headers: YellowCardHelper.buildHeader(data, path, method),
            data,
        }

        const response = await axios(options);

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
   * Update webhook
   * @static
   * @param {object} data - { id, url, state, active=true}
   *        state = payment.complete
   * @returns {object} - account details
   */  
  static async updateWebhook(data) {
    try {  

        const path = YellowCardHelper.endpoints.UPDATE_WEBHOOK.path
        const method = YellowCardHelper.endpoints.UPDATE_WEBHOOK.method

        const options = {
            url: YellowCardHelper.endpoints.UPDATE_WEBHOOK.url,
            method,
            headers: YellowCardHelper.buildHeader(data, path, method),
            data,
        }

        const response = await axios(options);

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
   * Remove webhook
   * @static
   * @param {object} data - { id }
   * @returns {object} - account details
   */  
  static async removeWebhook(data) {
    try {  

        const path = YellowCardHelper.endpoints.REMOVE_WEBHOOK.path
        const method = YellowCardHelper.endpoints.REMOVE_WEBHOOK.method

        const options = {
            url: YellowCardHelper.endpoints.REMOVE_WEBHOOK.url + `/${data.id}`,
            method,
            headers: YellowCardHelper.buildHeader(null, path, method),
        }

        const response = await axios(options);

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

  static async listWebhooks() {
    try {  

        const path = YellowCardHelper.endpoints.LIST_WEBHOOKS.path
        const method = YellowCardHelper.endpoints.LIST_WEBHOOKS.method
        const options = {
            url: YellowCardHelper.endpoints.LIST_WEBHOOKS.url,
            method,
            headers: YellowCardHelper.buildHeader(null, path, method),
        }

        const response = await axios(options);

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