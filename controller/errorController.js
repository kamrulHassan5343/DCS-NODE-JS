const AppError = require("../utils/appError");

const sendErrorDev = (error, res) => {
    console.log('Error:', error); // Debugging
    res.status(error.statusCode || 500).json({
        error: {
            statusCode: error.statusCode,
            status: error.status,
            message: error.message,
            stack: error.stack
        }
    });
};

const sendErrorProd = (error, res) => {
    if (error.isOperational) {
        res.status(error.statusCode || 500).json({
            status: error.status || 'error',
            message: error.message
        });
    } else {
        console.error('ERROR 💥', error);
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }
};

const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Handle Sequelize Unique Constraint Error
    if (err.name === 'SequelizeValidationError') {
        err = new AppError(err.errors[0].message, 400);
    }
    // Handle Sequelize Unique Constraint Error
    if (err.name === 'SequelizeUniqueConstraintError') {
        err = new AppError(err.errors[0].message, 400);
    }

    // Check if we're in development mode
    const isDevMode = process.env.NODE_ENV === 'development';

    if (isDevMode) {
        sendErrorDev(err, res);
    } else {
        sendErrorProd(err, res);
    }
};

module.exports = globalErrorHandler;
