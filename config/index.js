const dotenv = require('dotenv');
const rootPath = require('app-root-path');

dotenv.config();

const development = {
    host: process.env.LOCAL_HOST,
    port: process.env.PORT,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpires: process.env.JWT_EXPIRES_IN,
    database: process.env.DATABASE,
    apiKey: process.env.YC_API_KEY,
    apiSecret: process.env.YC_SECRET,
    ycBaseUrl: process.env.YC_BASE_URL,
    redisHost: process.env.REDIS_HOST,
    redisPort: process.env.REDIS_PORT,
    rootPath,
  }; 
if (process.env.NODE_ENV == "development"){
 module.exports = development;
}