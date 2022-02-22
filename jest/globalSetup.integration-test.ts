import {merge} from 'lodash';
import {addTestAWSBucket} from './addTestAWSBucket';
import {setupEnvVars} from './setupEnvVars';

async function integrationTestGlobalSetup() {
  const vars = merge(
    {},
    setupEnvVars('.env.test', 'from unit test env'),
    setupEnvVars('.env.integration-test', 'integration test env vars')
  );

  addTestAWSBucket(vars, 'integration-test');
}

module.exports = integrationTestGlobalSetup;
