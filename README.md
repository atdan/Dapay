# Dapay (Backend). 
### Documentation (Swagger)
  For API documentation, Please run this application and hit this route from any browser. 
http://localhost:9000/api-docs
 > It's not fully completed yet. 
### Features
* Authentication and Authorization. 
* Role based auth
* Payment. 
* Password Reset. 
* Client and Admin account management
* Payment Integration
* Logger
* Cache
* Swagger API Documentation 
### Requirements 
* Node v14+ 
* npm 
* Redis 
* Mongo DB 

### Step 1: Clone the repo 
``` 
git clone https://github.com/atdan/Dapay.git
cd Dapay
``` 
### Step 1: Create config.env
```
NODE_ENV=development/production
PORT=9036

DATABASE=mongodb://localhost:27017/dapay
JWT_SECRET=sayc-owgn-kktw-kktrw
JWT_EXPIRES_IN=1d

EMAIL_USERNAME_APP=#
EMAIL_PASSWORD_APP=#


REDIS_HOST=localhost
REDIS_PORT=6379

LOCAL_HOST=http://localhost:9036

# yellowcard
YC_API_KEY=yellow card api key
YC_SECRET=yellowcard api secret
YC_BASE_URL=yellowcard base url
```

### Step 3: Start the server 
install packages: run this command 
``` 
npm i 
``` 
Start this application: <br />
``` 
npm start
```

### Solution specifications
* Dapay is a Business account management system, the owner of the business is registered as an admin and able to signup clients under them and add them to their account. The Admin is given privildges to call the following endpoints
1. Single and Bulk Transfers without Approval i.e. their request is force approved
2. Accept and Deny Payment Requests
3. Create, Update and remove webhooks
4. Add and Remove Users linked to their account
5. View Account Details and Balance
6. All other actions that can be performed by their clients below
The Clients added to their Account are able to perform
1. Fetch Supported transaction Channels, Countries, Networks and Rates/
2. Perform account Lookup using Resolve Bank Account 
3. Single and Bulk Transfers which require approval from Admin

A System account which Moderates the application is authorized to:
1. Credit Accounts
2. Fetch System account Retrieve information about System Account with Yellowcard, including available balance.


### Challenges 
* Test Data Consistency: The endpoint to Submit Payment Request persistently returned 400 - Bad Request - Response code with no descriptive error message of the malformed/missing data And upon further inspection I noticed the request Body params provided in the API Reference and the Submit your first Payment Request Code Recipe were inconsistent. The code recipe included parameters such as country and currency which were not present in the API reference also in the recipe was amountUSD which was called amount in the API reference. The account number which was the recipe was also not a valid one as the valid account number was at the Sandbox testing section of the Guide.

* Resolve Bank Account: The endpoint to Resolve Bank Account returned 401 - Unauthorized despite other endpoints like Get Channels, Get Rates, Get Networks working with the same auth

* Endpoints Dependency: It was not possible to test endpoints like Lookup payment, Accept payment Request, and Deny Payment Request because the payment id needed to be gotten from successfully testing Submit Payment Request endpoint. I believe a default payment Id would help ease development 