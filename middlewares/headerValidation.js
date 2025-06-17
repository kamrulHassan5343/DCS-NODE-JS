const logger = require('../utils/logger');

const validateHeaders = (req, res, next) => {
    // Normalize headers to lowercase since HTTP headers are case-insensitive
    const headers = Object.keys(req.headers).reduce((acc, key) => {
        acc[key.toLowerCase()] = req.headers[key];
        return acc;
    }, {});

    const requiredHeaders = ['apikey', 'appid', 'appversioncode'];
    const missingHeaders = requiredHeaders.filter(h => !headers[h]);

    if (missingHeaders.length > 0) {
        logger.warn(`Missing headers: ${missingHeaders.join(', ')}`);
        return res.status(400).json({
            status: "E",
            message: `Missing required headers: ${missingHeaders.join(', ')}`
        });
    }

    // Debug log to see what's being compared
    logger.debug(`Received API Key: ${headers.apikey}`);
    logger.debug(`Expected API Key: ${process.env.API_KEY}`);

    // Validate API key
    if (headers.apikey !== process.env.API_KEY) {
        logger.warn(`Invalid API key attempt. Received: ${headers.apikey}`);
        return res.status(401).json({
            status: "E",
            message: "Invalid API key"
        });
    }

    next();
};

module.exports = { validateHeaders };