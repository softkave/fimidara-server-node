import {RequiredKeysOf} from 'type-fest';
import {AnyFn, AnyObject, ObjectValues} from '../utils/types';

export enum AppEnvVariables {
  CONFIG_FILE_PATH = 'CONFIG_FILE_PATH',
}

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

export interface FimidaraSuppliedConfig {
  clientDomain: string;
  mongoDbURI: string;
  mongoDbDatabaseName: string;
  jwtSecret: string;
  nodeEnv: string;
  port: string;
  S3Bucket: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  rootUserEmail: string;
  rootUserFirstName: string;
  rootUserLastName: string;
  fileBackend: FimidaraConfigFilePersistenceProvider;
  awsConfig?: {
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type InputFimidaraConfigItem<T = any> = {value: T} | {envName: string};

type ToInputConfigItem<T extends AnyObject> = {
  [K in keyof T]: InputFimidaraConfigItem<T[K]>;
};

export type InputFimidaraConfig = ToInputConfigItem<FimidaraSuppliedConfig>;
export interface FimidaraConfig extends FimidaraSuppliedConfig, FimidaraRuntimeConfig {}

type ConfigItemTransformFn<T> = T extends string
  ? {transform?: AnyFn<[string], T>}
  : {transform: AnyFn<[string], T>};

type ConfigItemBase<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validator?: AnyFn<[any], boolean | string>;
} & ConfigItemTransformFn<T>;

type ToConfigSchema<T extends AnyObject> = {
  [K in keyof T]: (K extends RequiredKeysOf<T>
    ? {required: false; defaultValue: T[K]} | {required: true; defaultValue?: T[K]}
    : {required?: false; defaultValue?: T[K]}) &
    ConfigItemBase<T[K]>;
};

export type FimidaraConfigSchema = ToConfigSchema<FimidaraSuppliedConfig>;
