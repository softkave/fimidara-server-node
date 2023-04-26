export enum AppEnvVariables {
  CLIENT_DOMAIN = 'CLIENT_DOMAIN',
  MONGODB_URI = 'MONGODB_URI',
  MONGODB_DATABASE_NAME = 'MONGODB_DATABASE_NAME',
  LOGS_DB_NAME = 'LOGS_DB_NAME',
  LOGS_COLLECTION_NAME = 'LOGS_COLLECTION_NAME',
  JWT_SECRET = 'JWT_SECRET',
  NODE_ENV = 'NODE_ENV',
  PORT = 'PORT',
  S3_BUCKET = 'S3_BUCKET',
  AWS_ACCESS_KEY_ID = 'AWS_ACCESS_KEY_ID',
  AWS_SECRET_ACCESS_KEY = 'AWS_SECRET_ACCESS_KEY',
  AWS_REGION = 'AWS_REGION',
  ROOT_USER_EMAIL = 'ROOT_USER_EMAIL',
  ROOT_USER_FIRST_NAME = 'ROOT_USER_FIRST_NAME',
  ROOT_USER_LAST_NAME = 'ROOT_USER_LAST_NAME',
  FILE_BACKEND = 'FILE_BACKEND',
}

export enum FileBackendType {
  S3 = 's3',
  Memory = 'memory',
}

export interface ISuppliedVariables {
  clientDomain: string;
  mongoDbURI: string;
  mongoDbDatabaseName: string;
  logsDbName: string;
  logsCollectionName: string;
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
}

interface IStaticVariables {
  serverInstanceId: string;
  appName: string;
  appDefaultEmailAddressFrom: string;
  awsEmailEncoding: string;
  dateFormat: string;
  clientLoginLink: string;
  clientSignupLink: string;
  changePasswordPath: string;
  verifyEmailPath: string;
}

// Added after the app initialization phase.
export interface AppRuntimeVars {
  appWorkspaceId: string;
  appWorkspacesImageUploadPermissionGroupId: string;
  appUsersImageUploadPermissionGroupId: string;
}

export interface AppVariables extends ISuppliedVariables, IStaticVariables, AppRuntimeVars {}

export type ExtractEnvSchema = Record<
  keyof ISuppliedVariables,
  {
    required?: boolean;
    name: AppEnvVariables;
    defaultValue?: string;
  }
>;
