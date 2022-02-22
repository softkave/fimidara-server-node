import {merge} from 'lodash';
import {
  getAppVariables,
  IAppVariables,
  envFns,
  extractProdEnvsSchema,
} from '../../resources/appVariables';
import singletonFunc from '../../utilities/singletonFunc';

export enum TestDataProviderType {
  Memory = 'memory',
  Mongo = 'mongo',
}

export interface ITestOnlyVariables {
  dataProviderType?: TestDataProviderType | typeof TestDataProviderType;
  useSESEmailProvider?: boolean;
  useS3FileProvider?: boolean;
}

export enum TestOnlyEnvVariables {
  DATA_PROVIDER_TYPE = 'DATA_PROVIDER_TYPE',
  USE_SES_EMAIL_PROVIDER = 'USE_SES_EMAIL_PROVIDER',
  USE_S3_FILE_PROVIDER = 'USE_S3_FILE_PROVIDER',
}

export type ITestVariables = ITestOnlyVariables & IAppVariables;

export const getTestVars = singletonFunc((): IAppVariables & ITestVariables => {
  const appVariables = getAppVariables(extractProdEnvsSchema, true);
  const testOnlyVars: ITestOnlyVariables = {
    dataProviderType: envFns.getOptional(
      TestOnlyEnvVariables.DATA_PROVIDER_TYPE,
      TestDataProviderType.Memory,
      (...args) => envFns.getEnum(args[0], args[1], TestDataProviderType)
    ),
    useSESEmailProvider: envFns.getOptional(
      TestOnlyEnvVariables.USE_SES_EMAIL_PROVIDER,
      false,
      envFns.getBoolean
    ),
    useS3FileProvider: envFns.getOptional(
      TestOnlyEnvVariables.USE_S3_FILE_PROVIDER,
      false,
      envFns.getBoolean
    ),
  };

  return merge(appVariables, testOnlyVars);
});
