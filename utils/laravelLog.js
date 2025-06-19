const fs = require('fs');
const path = require('path');

exports.laravelLog = () => {
    const dateCurrent = new Date().toISOString().split('T')[0];
    const logsDir = path.join(__dirname, '../storage/logs');
    
    // Check and rotate laravel-YYYY-MM-DD.log
    const dailyLogPath = path.join(logsDir, `laravel-${dateCurrent}.log`);
    if (fs.existsSync(dailyLogPath)) {
        const stats = fs.statSync(dailyLogPath);
        if (stats.size > 20000000) { // 20MB
            const currentTimeStamp = new Date().toISOString().replace(/[:.]/g, '-');
            fs.renameSync(dailyLogPath, path.join(logsDir, `laravel-${currentTimeStamp}.log`));
        }
    }
    
    // Check and rotate laravel.log
    const mainLogPath = path.join(logsDir, 'laravel.log');
    if (fs.existsSync(mainLogPath)) {
        const stats = fs.statSync(mainLogPath);
        if (stats.size > 20000000) { // 20MB
            const currentTimeStamp = new Date().toISOString().replace(/[:.]/g, '-');
            fs.renameSync(mainLogPath, path.join(logsDir, `laravelLog-${currentTimeStamp}.log`));
        }
    }
};