const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Create a writable stream for the current date's log file
const getLogStream = () => {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logFile = path.join(logsDir, `error-${date}.log`);
    return fs.createWriteStream(logFile, { flags: 'a' });
};

// Create a logger instance
const logger = {
    error: (message, error) => {
        const timestamp = new Date().toISOString();
        const logStream = getLogStream();
        
        const logMessage = `[${timestamp}] ERROR: ${message}\n`;
        logStream.write(logMessage);
        
        if (error) {
            const errorMessage = `[${timestamp}] ERROR DETAILS: ${error.stack || error}\n`;
            logStream.write(errorMessage);
        }
        
        logStream.end();
    }
};

module.exports = logger; 