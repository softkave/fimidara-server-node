import {RequiredKeysOf} from 'type-fest';
import {FileBackendProductType} from '../definitions/fileBackend';
import {AnyFn, AnyObject} from '../utils/types';

export enum AppEnvVariables {
  CONFIG_FILE_PATH = 'CONFIG_FILE_PATH',
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
  fileBackend: FileBackendProductType;
  awsConfig: {};

  // Primarily used by job runner to find unfinished jobs from previous
  // instances of the server. Since we currently only run one instance, the
  // runner can find jobs that are in progress from instances that are not the
  // current server instance and prioritize running those first.
  // `serverInstanceId` should be unique per server instance.
  // TODO: This behaviour will need to change once we start running multiple
  // instances.
  serverInstanceId: string;

  /** Users on waitlist cannot create workspaces but can be added to an existing
   * workspace. */
  FLAG_waitlistNewSignups: boolean;

  /** Where to persist files when `fileBackend` is
   * {@link FilePersistenceType.LocalFs} */
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
