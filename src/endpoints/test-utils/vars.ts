import {setAppVariables, getAppVariables} from '../../resources/appVariables';
import singletonFunc from '../../utilities/singletonFunc';

export const getTestVars = singletonFunc(() => {
  setAppVariables({
    clientDomain: 'localhost:3000',
    mongoDbURI:
      'mongodb+srv://softkave:LMOGkLHjho8L2ahx@softkave.ocsur.mongodb.net/files-unit-test?authSource=admin&replicaSet=atlas-hflb2m-shard-0&w=majority&readPreference=primary&retryWrites=true&ssl=true',
    jwtSecret: 'test-jwt-secret-5768394',
    nodeEnv: 'test',
    port: '5000',
    S3Bucket: 'files-unit-test',
  });

  const appVariables = getAppVariables();
  return appVariables;
});
