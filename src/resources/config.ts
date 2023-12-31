import config from 'config';
import {existsSync} from 'fs';
import {pathExists, readJSON, readJSONSync} from 'fs-extra';
import {merge} from 'lodash';
import path from 'path';
import {AnyObject, ObjectValues} from '../utils/types';

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

export function getSuppliedConfigSync(): FimidaraSuppliedConfig {
  const envSuppliedConfig = config.util.toObject();
  const configLocalOverrideFilePath = path.normalize(
    process.cwd() + './config/local.json'
  );
  let configLocalOverride: AnyObject = {};

  if (existsSync(configLocalOverrideFilePath)) {
    configLocalOverride = readJSONSync(configLocalOverrideFilePath);
  }

  return merge({}, envSuppliedConfig, configLocalOverride);
}

export async function getSuppliedConfig(): Promise<FimidaraSuppliedConfig> {
  const envSuppliedConfig = config.util.toObject();
  const configLocalOverrideFilePath = path.normalize(
    process.cwd() + './config/local.json'
  );
  let configLocalOverride: AnyObject = {};

  if (await pathExists(configLocalOverrideFilePath)) {
    configLocalOverride = await readJSON(configLocalOverrideFilePath);
  }

  return merge({}, envSuppliedConfig, configLocalOverride);
}
