// Simple logger utility
class Logger {
    info(message) {
        console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
    }

    warn(message) {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
    }

    error(message, error = null) {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
        if (error) {
            console.error(error);
        }
    }

    debug(message) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`);
        }
    }
}

module.exports = new Logger();