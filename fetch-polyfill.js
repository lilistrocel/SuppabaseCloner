// This file provides a polyfill for fetch in environments that don't natively support it
const fetch = require('cross-fetch');
global.fetch = fetch;
module.exports = fetch; 