import {setAppVariables, getAppVariables} from '../../resources/appVariables';
import singletonFunc from '../../utilities/singletonFunc';

enum TestDataProviderType {
  Memory = 'memory',
  Mongo = 'mongo',
}

export interface ITestVariables {
  dataProviderType?: TestDataProviderType;
  useSESEmailProvider?: boolean;
  useS3FileProvider?: boolean;
}

export const getTestVars = singletonFunc(() => {
  setAppVariables({
    clientDomain: 'localhost:3000',
    mongoDbURI: process.env.MONGO_URI,
    jwtSecret: 'test-jwt-secret-5768394',
    nodeEnv: 'test',
    port: '5000',
    S3Bucket: 'files-unit-test',
  });

  const appVariables = getAppVariables();
  return appVariables;
});
