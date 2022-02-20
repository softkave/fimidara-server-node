const dotenv = require('dotenv');

async function setupEnvVars() {
  const result = dotenv.config({
    debug: true,
    path: '.env.test',
    override: true,
  });

  if (result.error) {
    throw result.error;
  }

  console.log('-- unit test env vars --');
  console.log(result.parsed);
  console.log('-- unit test env vars --');
}

module.exports = setupEnvVars;
