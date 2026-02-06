#!/usr/bin/env node

const { run } = require('../lib/cli.js');

run(process.argv.slice(2)).catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
