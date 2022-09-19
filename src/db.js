const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./sipeko.db', (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    }
});

module.exports = db