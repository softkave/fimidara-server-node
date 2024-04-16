import config from 'config';
import {ValueOf} from 'type-fest';
import {LoggerType} from '../endpoints/contexts/logger/types';

/** Added after the app initialization phase. */
export interface FimidaraRuntimeConfig {
  appWorkspaceId: string;
  appWorkspacesImageUploadPermissionGroupId: string;
  appUsersImageUploadPermissionGroupId: string;
}

export const kFimidaraConfigFilePersistenceProvider = {
  s3: 's3',
  fs: 'fs',
  memory: 'memory',
} as const;

export type FimidaraConfigFilePersistenceProvider = ValueOf<
  typeof kFimidaraConfigFilePersistenceProvider
>;

export const kFimidaraConfigEmailProvider = {
  ses: 'ses',
  noop: 'noop',
} as const;

export type FimidaraConfigEmailProvider = ValueOf<typeof kFimidaraConfigEmailProvider>;

export const kFimidaraConfigSecretsManagerProvider = {
  awsSecretsManager: 'awsSecretsManager',
  memory: 'memory',
} as const;

export type FimidaraConfigSecretsManagerProvider = ValueOf<
  typeof kFimidaraConfigSecretsManagerProvider
>;

export const kFimidaraConfigDbType = {
  mongoDb: 'mongoDb',
  noop: 'noop',
} as const;

export type FimidaraConfigDbType = ValueOf<typeof kFimidaraConfigDbType>;

export interface AWSConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export type FimidaraSuppliedConfig = Partial<{
  clientDomain: string;
  dbType: FimidaraConfigDbType;
  mongoDbURI: string;
  mongoDbDatabaseName: string;
  jwtSecret: string;
  exposeHttpServer: boolean;
  httpPort: string;
  exposeHttpsServer: boolean;
  httpsPort: string;
  httpsPublicKeyFilepath: string;
  httpsPrivateKeyFilepath: string;
  S3Bucket: string;
  rootUserEmail: string;
  rootUserPassword: string;
  rootUserFirstName: string;
  rootUserLastName: string;
  fileBackend: FimidaraConfigFilePersistenceProvider;
  emailProvider: FimidaraConfigEmailProvider;
  secretsManagerProvider: FimidaraConfigSecretsManagerProvider;
  awsConfig: AWSConfig;
  /** Users on waitlist cannot create workspaces but can be added to an existing
   * workspace. */
  FLAG_waitlistNewSignups: boolean;
  /** Where to persist files when `fileBackend` is
   * {@link kFimidaraConfigFilePersistenceProvider.fs} */
  localFsDir?: string;
  appName: string;
  appDefaultEmailAddressFrom: string;
  awsEmailEncoding: string;
  dateFormat: string;
  clientLoginLink: string;
  clientSignupLink: string;
  changePasswordLink: string;
  verifyEmailLink: string;
  test: {
    awsConfig?: AWSConfig;
    bucket?: string;
    localFsDir?: string;
  };
  loggerType: LoggerType;
  runnerLocation: string;
  startApp: boolean;
  startPool: boolean;
}>;

export type FimidaraConfig = FimidaraSuppliedConfig & FimidaraRuntimeConfig;

export function getSuppliedConfig(): FimidaraSuppliedConfig {
  const envSuppliedConfig = config.util.toObject();
  return envSuppliedConfig;
}
