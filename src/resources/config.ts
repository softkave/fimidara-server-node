import config from 'config';
import {ValueOf} from 'type-fest';
import {LoggerType} from '../contexts/logger/types.js';

/** Added after the app initialization phase. */
export interface FimidaraRuntimeConfig {
  appWorkspaceId: string;
}

export const kFimidaraConfigFilePersistenceProvider = {
  s3: 's3',
  fs: 'fs',
  memory: 'mem',
} as const;

export type FimidaraConfigFilePersistenceProvider = ValueOf<
  typeof kFimidaraConfigFilePersistenceProvider
>;

export const kFimidaraConfigEmailProvider = {
  ses: 'ses',
  noop: 'noop',
} as const;

export type FimidaraConfigEmailProvider = ValueOf<
  typeof kFimidaraConfigEmailProvider
>;

export const kFimidaraConfigSecretsManagerProvider = {
  awsSecretsManager: 'awsSecretsManager',
  memory: 'mem',
} as const;

export type FimidaraConfigSecretsManagerProvider = ValueOf<
  typeof kFimidaraConfigSecretsManagerProvider
>;

export const kFimidaraConfigDbType = {
  mongoDb: 'mongoDb',
  noop: 'noop',
} as const;

export type FimidaraConfigDbType = ValueOf<typeof kFimidaraConfigDbType>;

export const kFimidaraConfigQueueProvider = {
  redis: 'redis',
  memory: 'mem',
} as const;

export type FimidaraConfigQueueProvider = ValueOf<
  typeof kFimidaraConfigQueueProvider
>;

export const kFimidaraConfigPubSubProvider = {
  redis: 'redis',
  memory: 'mem',
} as const;

export type FimidaraConfigPubSubProvider = ValueOf<
  typeof kFimidaraConfigPubSubProvider
>;

export const kFimidaraConfigCacheProvider = {
  redis: 'redis',
  memory: 'mem',
} as const;

export type FimidaraConfigCacheProvider = ValueOf<
  typeof kFimidaraConfigCacheProvider
>;

export const kFimidaraConfigRedlockProvider = {
  redis: 'redis',
  memory: 'mem',
} as const;

export type FimidaraConfigRedlockProvider = ValueOf<
  typeof kFimidaraConfigRedlockProvider
>;

export interface AWSConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export type FimidaraSuppliedConfig = Partial<{
  // DB
  dbType: FimidaraConfigDbType;
  mongoDbURI: string;
  mongoDbDatabaseName: string;

  // Session
  jwtSecret: string;

  // Transport
  exposeHttpServer: boolean;
  httpPort: string;
  exposeHttpsServer: boolean;
  httpsPort: string;
  httpsPublicKeyFilepath: string;
  httpsPrivateKeyFilepath: string;

  // Management
  rootUserEmail: string;
  rootUserPassword: string;
  rootUserFirstName: string;
  rootUserLastName: string;

  // File
  fileBackend: FimidaraConfigFilePersistenceProvider;
  localFsDir?: string;
  localPartsFsDir?: string;
  multipartLockTimeoutSeconds?: number;

  // Email
  emailProvider: FimidaraConfigEmailProvider;
  senderEmailAddress: string;

  // Secrets
  secretsManagerProvider: FimidaraConfigSecretsManagerProvider;

  // Flags
  /** Users on waitlist cannot create workspaces but can be added to an existing
   * workspace. */
  FLAG_waitlistNewSignups: boolean;
  /** Where to persist files when `fileBackend` is
   * {@link kFimidaraConfigFilePersistenceProvider.fs} */

  // Runtime, may rename later
  appName: string;
  dateFormat: string;
  useFimidaraApp: boolean;
  useFimidaraWorkerPool: boolean;

  // URLs
  clientDomain: string;
  clientLoginLink: string;
  clientSignupLink: string;
  changePasswordLink: string;
  verifyEmailLink: string;
  upgradeWaitlistLink: string;

  // Logs
  loggerType: LoggerType;

  // Worker
  runnerLocation: string;
  runnerCount: number;

  // Jobs
  // newSignupsOnWaitlistJobIntervalMs: number;

  // AWS configs
  awsConfigs?: Partial<{
    all: AWSConfig;
    s3: AWSConfig;
    ses: AWSConfig;
    secretsManager: AWSConfig;
    s3Bucket: string;
    sesEmailEncoding: string;
  }>;

  // Queues
  queueProvider: FimidaraConfigQueueProvider;
  queueRedisURL: string;
  queueDatabase: number;
  addFolderQueueStart: number;
  addFolderQueueEnd: number;
  addFolderQueueNo: number[];
  addFolderTimeoutMs: number;
  addFolderQueuePrefix: string;

  // PubSub
  pubSubProvider: FimidaraConfigPubSubProvider;
  pubSubRedisURL: string;
  pubSubDatabase: number;
  addFolderPubSubChannelPrefix: string;

  // Cache
  cacheProvider: FimidaraConfigCacheProvider;
  cacheRedisURL: string;
  cacheDatabase: number;

  // Redlock
  redlockProvider: FimidaraConfigRedlockProvider;
  redlockRedisURL: string;
  redlockDatabase: number;
}>;

export type FimidaraConfig = FimidaraSuppliedConfig & FimidaraRuntimeConfig;

export function getSuppliedConfig(): FimidaraSuppliedConfig {
  const suppliedConfig = config.util.toObject();
  return suppliedConfig;
}
