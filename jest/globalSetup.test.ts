import {addTestAWSBucket} from './addTestAWSBucket';
import {setupEnvVars} from './setupEnvVars';

async function testGlobalSetup() {
  const vars = setupEnvVars('.env.test', 'unit test env vars') || {};
  addTestAWSBucket(vars, 'unit-test');
}

module.exports = testGlobalSetup;
