import {RequiredKeysOf} from 'type-fest';
import {AnyFn, AnyObject} from '../utils/types';

export enum AppEnvVariables {
  CONFIG_FILE_PATH = 'CONFIG_FILE_PATH',
}

export enum FileBackendType {
  S3 = 's3',
  Memory = 'memory',
  LocalFs = 'fs',
}

// Added after the app initialization phase.
export interface FimidaraRuntimeConfig {
  appWorkspaceId: string;
  appWorkspacesImageUploadPermissionGroupId: string;
  appUsersImageUploadPermissionGroupId: string;
  // configFilepath: string;
}

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
  fileBackend: FileBackendType;
  serverInstanceId: string;

  /** Users on waitlist cannot create workspaces but can be added to an existing
   * workspace. */
  FLAG_waitlistNewSignups: boolean;

  /** Where to persist files when `fileBackend` is
   * {@link FileBackendType.LocalFs} */
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
  validator?: AnyFn<[any], boolean | string>;
} & ConfigItemTransformFn<T>;
type ToConfigSchema<T extends AnyObject> = {
  [K in keyof T]: (K extends RequiredKeysOf<T>
    ? {required: false; defaultValue: T[K]} | {required: true; defaultValue?: T[K]}
    : {required?: false; defaultValue?: T[K]}) &
    ConfigItemBase<T[K]>;
};

export type FimidaraConfigSchema = ToConfigSchema<FimidaraSuppliedConfig>;
