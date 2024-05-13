const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'Please enter your first name'],
    },
    lastName: {
        type: String,
        required: [true, 'Please enter your last name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide a valid email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    phoneNumber: {
        type: String,
    },
    role: {
        type: String,
        enum: ['client', 'admin'],
        default: 'user',
    },
    customerType: {
        type: String,
        enum: ['retail', 'institution'],
        default: 'retail',
    },
    country: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    idNumber: {
        type: String,
        required: true
    },
    idType: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password. min of 6 characters'],
        minlength: 6,
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            // This only works on CREATE and SAVE! 
            validator: function(el) {
                return el === this.password
            }
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: false,
        select: false,
    },
})


userSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if(!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm field
    this.passwordConfirm = undefined;

    next()
})

//creating a instance for correct password
userSchema.methods.currectPassword = async function (
    candidatePassword,
    userPassword
  ) {
    return await bcrypt.compare(candidatePassword, userPassword);
  };

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if(this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)

        return JWTTimestamp < changedTimestamp;
    }
}


userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    console.log({resetToken}, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

// Create method to compare password input to password saved in database
userSchema.methods.comparePassword = function(pw, cb) {
    bcrypt.compare(pw, this.password, function(err, isMatch) {
      if (err) {
        return cb(err);
      }
  
      cb(null, isMatch);
    });
  };

const Users = mongoose.model('Users', userSchema)

// //test User
// const testUser = new Users({
//   name: "Sajjad",
//   email: "sajjadhossain55@gmail.com",
//   role: "admin",
//   password: "sajjad2255",
//   passwordConfirm: "sajjad2255",
// });

// testUser.save().then((doc) => console.log(doc));

module.exports = Users;