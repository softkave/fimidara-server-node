const dotenv = require('dotenv');

const result = dotenv.config({
  debug: true,
  path: '.env.test',
  override: true,
});

if (result.error) {
  throw result.error;
}

console.log('-- test env vars --');
console.log(result.parsed);
console.log('-- test env vars --');
