const path = require('path');

module.exports = {
  // ...existing webpack config if any...
  resolve: {
    fallback: {
      "path": false,
      "os": false,
      "crypto": false,
      "fs": false
    }
  }
};