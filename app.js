const express = require("express");
const app = express();

// Swagger
const swaggerUI = require("swagger-ui-express");

//security
const cors = require('cors');
const xss = require('xss-clean');
const hpp = require('hpp');
const mongoSanitize = require('hpp');
const bodyParser = require("body-parser");


//cache
require("./services/cache");
//logger
const Logger = require("./config/logger");
global.logger = Logger.createLogger({label: "Dapay"})

// Routers
const userRouter = require('./routes/userRoutes');
const transactionRouter = require('./routes/transactionRoutes')
const accountsRouter = require('./routes/accountRoutes')


// Errors
const AppError = require("./utils/AppError");
const globalErrorHandler = require("./controllers/errorController");

app.use(cors({
  credentials: 'include',
  origin: '*'
}));

app.use(express.json({ limit: '10kb' }));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.use((req, res, next) => {
  console.log("hello from middleware");
  next();
});

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp(
    //   {
    //   whitelist: ['duration'], // declare here all witelisted feild
    // }
  )
);


//Routes
app.use('/api/users', userRouter);
app.use('/api/transactions', transactionRouter)
app.use('/api/accounts', accountsRouter)

// Swagger route open with data
const swaggerDocument = require('./swagger.json');
// const passport = require("passport");

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));


app.all("*", (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);



module.exports = app;
