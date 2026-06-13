/**
 * Jest globalSetup — runs once before all test suites.
 * Loads .env so process.env is populated for every worker.
 */
module.exports = async function globalSetup() {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
};
