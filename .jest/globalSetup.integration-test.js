const dotenv = require('dotenv');

async function setupEnvVars() {
  const result = dotenv.config({
    debug: true,
    path: '.env.test',
    override: true,
  });

  const result = dotenv.config({
    debug: true,
    path: '.env.integration-test',
    override: true,
  });

  if (result.error) {
    throw result.error;
  }

  console.log('-- integration test env vars --');
  console.log(result.parsed);
  console.log('-- integration test env vars --');
}

module.exports = setupEnvVars;
