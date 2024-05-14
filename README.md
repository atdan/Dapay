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