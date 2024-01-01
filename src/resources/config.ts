import config from 'config';
import {ObjectValues} from '../utils/types';

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

export type FimidaraConfigFilePersistenceProvider = ObjectValues<
  typeof kFimidaraConfigFilePersistenceProvider
>;

export const kFimidaraConfigEmailProvider = {
  ses: 'ses',
  noop: 'noop',
} as const;

export type FimidaraConfigEmailProvider = ObjectValues<
  typeof kFimidaraConfigEmailProvider
>;

export const kFimidaraConfigSecretsManagerProvider = {
  awsSecretsManager: 'awsSecretsManager',
  memory: 'memory',
} as const;

export type FimidaraConfigSecretManagerProvider = ObjectValues<
  typeof kFimidaraConfigSecretsManagerProvider
>;

export type FimidaraSuppliedConfig = Partial<{
  clientDomain: string;
  mongoDbURI: string;
  mongoDbDatabaseName: string;
  jwtSecret: string;
  port: string;
  S3Bucket: string;
  rootUserEmail: string;
  rootUserFirstName: string;
  rootUserLastName: string;
  fileBackend: FimidaraConfigFilePersistenceProvider;
  emailProvider: FimidaraConfigEmailProvider;
  secretsManagerProvider: FimidaraConfigSecretManagerProvider;
  awsConfig: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
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
}>;

export type FimidaraConfig = FimidaraSuppliedConfig & FimidaraRuntimeConfig;

export function getSuppliedConfig(): FimidaraSuppliedConfig {
  const envSuppliedConfig = config.util.toObject();
  return envSuppliedConfig;
}
