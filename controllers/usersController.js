const Users = require('../models/users');
const AppError = require("../utils/AppError");
const APIFeatures = require("../services/apiFeatures")

// Factory controller
const factory = require('../controllers/handleFactory')

exports.getAllUsers = async (req, res, next) => {
    try {
        const features = new APIFeatures(Users.find(), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        // const doc = await features.query.explain();
        const doc = await features.query;

        // send responce
        res.status(200).json({
            status: 'success',
            results: doc.length,
            data: doc
        })
    } catch (error) {
        next(error);
    }
}

exports.createUser = factory.createOne(Users);
exports.getUser = factory.getOne(Users);
exports.updateUser = factory.updateOne(Users);
exports.deleteUser = factory.deleteOne(Users)

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id

    next()
}