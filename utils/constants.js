const transactionTypes = {
    DEBIT: "Debit",
    CREDIT: "Credit"
}

const transactionSource = {
    INTERNAL: "Internal",
    EXTERNAL: "External"
}

const charges = {
  INTERNAL: 15,
  EXTERNAL: 30
}

const currency = {
    NGN: "NGN",
    USD: "USD",
}

const statusCodes = {
  "100": "Continue",
  "101": "Switching Protocols",
  "200": "OK",
  "201": "Created",
  "202": "Accepted",
  "204": "No Content",
  "206": "Partial Content",
  "300": "Multiple Choices",
  "301": "Moved Permanently",
  "302": "Found",
  "304": "Not Modified",
  "307": "Temporary Redirect",
  "400": "Bad Request",
  "401": "Unauthorized",
  "403": "Forbidden",
  "404": "Not Found",
  "405": "Method Not Allowed",
  "409": "Conflict",
  "410": "Gone",
  "413": "Payload Too Large",
  "414": "URI Too Long",
  "415": "Unsupported Media Type",
  "429": "Too Many Requests",
  "500": "Internal Server Error",
  "501": "Not Implemented",
  "502": "Bad Gateway",
  "503": "Service Unavailable",
  "504": "Gateway Timeout"
}

async function generateAccountNumber (){
  let randomNum = '';
  for (let i = 0; i < 10; i++) {
    randomNum += Math.floor(Math.random() * 10); // Generate a random digit (0-9)
  }
  return randomNum;
}



module.exports = {
    transactionTypes,
    transactionSource,
    currency,
    generateAccountNumber,
    charges,
}