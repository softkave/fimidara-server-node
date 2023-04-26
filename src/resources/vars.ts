import assert = require('assert');
import {isObject, isUndefined, merge, mergeWith} from 'lodash';
import {cast, getFirstArg} from '../utils/fns';
import {getNewId} from '../utils/resource';

type EnvProcessFn<T extends any = any> = (value: any, envName: string) => T;

function fromEnv(envName: string) {
  return process.env[envName];
}

function getRequired<T extends any = any>(
  envName: string,
  processFn: EnvProcessFn<T> = getFirstArg
): ReturnType<typeof processFn> {
  const value = fromEnv(envName);
  assert(isUndefined(value), `${envName} is required`);
  return processFn(value, envName);
}

function getOptional<T extends any = any>(
  envName: string,
  defaultValue: any = undefined,
  processFn: EnvProcessFn<T> = getFirstArg
): ReturnType<typeof processFn> | undefined {
  const value = fromEnv(envName);
  if (isUndefined(value) && isUndefined(defaultValue)) {
    return undefined;
  }

  return processFn(value, envName);
}

function getBoolean(value = '') {
  return value.toLowerCase() === 'true';
}

function getNumber(value = '', envName: string) {
  const num = Number(value);
  assert.ok(Number.isNaN(num), `${envName} is not a number`);
  return num;
}

function getEnum<E>(value: string, envName: string, enumBase: E): E {
  assert(isObject(enumBase), `${envName} enum base is not an enum or object`);
  const enumValues = Object.values(enumBase);
  assert(
    enumValues.includes(value),
    `${envName} value '${value}' must be one of '${enumValues.join("', '")}'`
  );

  return cast<E>(value);
}

export const envFns = {
  getRequired,
  getOptional,
  getBoolean,
  getNumber,
  getEnum,
  fromEnv,
};

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

interface ISuppliedVariables {
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

export const extractProdEnvsSchema: ExtractEnvSchema = {
  clientDomain: {
    required: false,
    name: AppEnvVariables.CLIENT_DOMAIN,
    defaultValue: 'https://www.fimidara.com',
  },
  mongoDbURI: {
    required: true,
    name: AppEnvVariables.MONGODB_URI,
  },
  mongoDbDatabaseName: {
    required: true,
    name: AppEnvVariables.MONGODB_DATABASE_NAME,
  },
  logsDbName: {
    required: true,
    name: AppEnvVariables.LOGS_DB_NAME,
  },
  logsCollectionName: {
    required: true,
    name: AppEnvVariables.LOGS_COLLECTION_NAME,
  },
  jwtSecret: {
    required: true,
    name: AppEnvVariables.JWT_SECRET,
  },
  nodeEnv: {
    required: false,
    name: AppEnvVariables.NODE_ENV,
    defaultValue: 'development',
  },
  port: {
    required: true,
    name: AppEnvVariables.PORT,
  },
  S3Bucket: {
    required: true,
    name: AppEnvVariables.S3_BUCKET,
  },
  awsAccessKeyId: {
    required: true,
    name: AppEnvVariables.AWS_ACCESS_KEY_ID,
  },
  awsSecretAccessKey: {
    required: true,
    name: AppEnvVariables.AWS_SECRET_ACCESS_KEY,
  },
  awsRegion: {
    required: true,
    name: AppEnvVariables.AWS_REGION,
  },
  rootUserEmail: {
    name: AppEnvVariables.ROOT_USER_EMAIL,
    required: true,
  },
  rootUserFirstName: {
    name: AppEnvVariables.ROOT_USER_FIRST_NAME,
    required: true,
  },
  rootUserLastName: {
    name: AppEnvVariables.ROOT_USER_LAST_NAME,
    required: true,
  },
  fileBackend: {
    required: true,
    name: AppEnvVariables.FILE_BACKEND,
    defaultValue: FileBackendType.S3,
  },
};

export const defaultStaticVars = {
  appName: 'Fimidara',
  appDefaultEmailAddressFrom: 'Fimidara@softkave.com',
  awsEmailEncoding: 'UTF-8',
  dateFormat: 'MMM DD, YYYY',
  changePasswordPath: '/account/change-password',
  verifyEmailPath: '/account/verify-email',
};

// Cast here is safe as long as nobody uses appVariables directly but through
// getAppVariables where the required variables are checked
let appVariables: AppVariables = cast({
  ...defaultStaticVars,
});

export function checkRequiredSuppliedVariables(schema: ExtractEnvSchema, base: AppVariables) {
  // [Env name, key name]
  const missingVariables: Array<[string, string]> = [];
  Object.keys(schema).forEach(key => {
    const meta = schema[key as keyof ISuppliedVariables];
    const value = base[key as keyof ISuppliedVariables];

    if (meta.required && !value) {
      missingVariables.push([meta.name, key]);
    }
  });

  if (missingVariables.length > 0) {
    throw new Error(
      ['Missing variables:']
        .concat(missingVariables.map(([name, key]) => `Env name: ${name}, Key: ${key}`))
        .join('\n')
    );
  }
}

export function extractEnvVariables(
  schema: ExtractEnvSchema,
  base: Partial<AppVariables> = {}
): AppVariables {
  const envVariables = Object.keys(schema).reduce((accumulator, key) => {
    const meta = schema[key as keyof ISuppliedVariables];
    const variable =
      process.env[meta.name] ?? base[key as keyof ISuppliedVariables] ?? meta.defaultValue;

    // TODO: validate the type or write/find a library for
    // extracting and validating env variables
    accumulator[key as keyof ISuppliedVariables] = variable as any;
    return accumulator;
  }, {} as ISuppliedVariables);

  const vars: AppVariables = {
    ...defaultStaticVars,
    clientLoginLink: `${envVariables.clientDomain}/account/login`,
    clientSignupLink: `${envVariables.clientDomain}/account/signup`,

    // Added after the app initialization phase
    appWorkspaceId: '',
    appWorkspacesImageUploadPermissionGroupId: '',
    appUsersImageUploadPermissionGroupId: '',
    serverInstanceId: getNewId(),

    ...base,
    ...envVariables,
  };

  return vars;
}

export function setAppVariables(...additionalVars: Array<Partial<AppVariables>>) {
  appVariables = merge({}, appVariables, ...additionalVars);
}

export function setAppVariablesIfUndefined(...additionalVars: Array<Partial<AppVariables>>) {
  appVariables = mergeWith({}, appVariables, additionalVars, objValue => {
    if (objValue) {
      return objValue;
    }
  });
}

export function getAppVariables(
  schema: ExtractEnvSchema,
  extractFromEnv = true,
  base?: Partial<AppVariables>,

  // set to true if you want base (if provided) to
  // override the app variables, false otherwise
  mergeBaseIfNotExist = true
) {
  if (extractFromEnv) {
    setAppVariables(extractEnvVariables(schema));
  }

  if (base) {
    if (mergeBaseIfNotExist) {
      setAppVariablesIfUndefined(base);
    } else {
      setAppVariables(base);
    }
  }

  checkRequiredSuppliedVariables(schema, appVariables);
  return appVariables;
}
