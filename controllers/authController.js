const { promisify } = require("util");
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const Users = require("../models/users")
const Accounts = require("../models/accounts")
const AppError = require("../utils/AppError")
const sendMail = require('../utils/email')
const config = require("../config")
const { clearKey } = require("../services/cache")
const { generateAccountNumber, currency } = require("../utils/constants")

const signToken = (id) =>
  jwt.sign({ id: id }, config.jwtSecret, {
    expiresIn: config.jwtExpires,
  });

const createSendToken = (user, account, statusCode, req, res) => {
    const token = signToken(user._id)

    // Remove some feild from output
    user.password = undefined,
    user.passwordResetExpires = undefined,
    user.passwordResetToken = undefined

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
            account,
        }
    })
}

exports.signup = async (req, res, next) => {
    try {
        const {firstName, lastName, email, idType, idNumber, address,
            password, role, phone, passwordConfirm, dob, country} = req.body;

        // check if email and password exist
        if(!email || !password) {
            return next(new AppError('Please provide email and password', 400))
        }

        // check if user exist && password is correct
        const user = await Users.findOne({email}).select('+password');

        if (user) {
            return next(new AppError("User already exists", 400))
        }

        const newUser = await Users.create({
            firstName,
            lastName,
            email,
            phoneNumber: phone,
            password,
            passwordConfirm,
            role,
            idType,
            idNumber,
            address,
            dob,
            country
        })

        if (!newUser) {
            return next(new AppError("Error creating user", 500))
        }

        let account;
        if (newUser.role == 'admin') {
             account = await Accounts.create({
                user: newUser._id,
                accountNumber: (await generateAccountNumber()),
                accountName: newUser.firstName + " " + newUser.lastName,
                currency: currency.USD,
            });
        }

        // create token,
        createSendToken(newUser, account, 201,req, res)
    } catch (err) {
        next(err)
    }
}

exports.login = async (req, res, next) => {
    try {
        const {email, password} = req.body;

        // check if email and password exist
        if(!email || !password) {
            return next(new AppError('Please provide email and password', 400))
        }

        // check if user exist && password is correct
        const user = await Users.findOne({email}).select('+password');

        if (!user) {
            return next(new AppError("User not found", 401))
        }

        user.comparePassword(password, async function(err, isMatch) {
            if (isMatch && !err) {
                const account = await Accounts.findOne({user: user._id});
                createSendToken(user, account, 200, req, res)
            }else {
                if (!err) {
                    return next(new AppError('Incorrect email or password', 403))
                }
                return next(new AppError(err, 500))
            }
        })

    } catch (err) {
        next(err)
    }
    
}


// Protect function
exports.protect = async (req,res, next) => {
    try {
        // Getting token and check of it's there
        let token;
        if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if(!token) {
            return next(new AppError('You are not log in! Please log in to get access', 401))
        }
        // Verification token
        const decoded = await promisify(jwt.verify)(token, config.jwtSecret);
        // Check if user still exists
        const currentUser = await Users.findById(decoded.id);

        if(!currentUser) {
            return next(new AppError('The user belonging to this token does n longer exist', 401))
        }
        // Check if user changed password after the token was issued.
        if(currentUser.changedPasswordAfter(decoded.iat)) {
            return next(new AppError('User recently change password. Please log in again', 400))
        }

        const userAccount = await Accounts.findOne({
            user: currentUser._id,
            currency: currency.USD
        })

        if (userAccount) {
            req.account = userAccount;
        }

        // GRANT ACCESS TO PROTECTED ROUTE
        req.user = currentUser;
        next() 
    } catch (error) {
        next(error)
    }
    
}

exports.restrictTo = (...roles) => (req, res, next) => {
    console.log(`User role: ${req.user.role} auth: ${roles}`)
    console.log(`includes: ${roles.includes(req.user.role)}`)
    if(!roles.includes(req.user.role)) {
        return next(new AppError('You do not have permission to perform this action', 403))
    }
    next()
}

exports.forgotPassword = async (req, res, next) => {
    try {
        // 1) Get user based on posted email
        const user = await Users.findOne({email: req.body.email})

        if(!user) {
            return next(new AppError('There is no user with email address', 404))
        }
        // 2) Generate the random reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({validateBeforeSave: false})

        let resetURL;
        // 3) Send it to user's email
        if(process.env.NODE_ENV === 'development') {
            resetURL = `${process.env.LOCAL_HOST_ADDRESS}/resetPassword/${resetToken}`;

        } else if(process.env.NODE_ENV === 'production') {

            resetURL = `${process.env.HOST_ADDRESS}/resetPassword/${resetToken}`;
        }

        // this message not using right now.
        const message = `Forgot your password ? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password please ignore this message`;

        try {
            await sendMail({
                email: user.email,
                subject: 'Your password reset token (valid for 10 min)',
                resetURL,
            })

            res.status(200).json({
                status: 'success',
                message: 'Token sent to email'
            })
        } catch (error) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
      
            return next(
              new AppError('There was an error sending the email. Try again later', 500)
            );
        }
    } catch (err) {
        next(err)
    }
}


exports.resetPassword = async (req, res, next) => {
    try {
        // 1) Get user based on the token
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await Users.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}});
        // 2) if token has not expired and there is user, set the new password,
        if(!user) {
            return next(new AppError('Token is invalid or has expired', 400))
        }

        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.passwordChangedAt = Date.now();    
        await user.save();

        const account = await Accounts.findOne({user: user._id});

        // 3) Log the user in, send JWT
        createSendToken(user, account, 200, req, res)
    } catch (err) {
        next(err)
    }
}


