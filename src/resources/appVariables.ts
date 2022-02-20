import assert = require('assert');
import {isObject, isUndefined, merge} from 'lodash';
import cast, {getFirstArg} from '../utilities/fns';

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

function getBoolean(value: string = '') {
  return value.toLowerCase() === 'true';
}

function getNumber(value: string = '', envName: string) {
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
  JWT_SECRET = 'JWT_SECRET',
  NODE_ENV = 'NODE_ENV',
  PORT = 'PORT',
  S3_BUCKET = 'S3_BUCKET',
  AWS_ACCESS_KEY_ID = 'AWS_ACCESS_KEY_ID',
  AWS_SECRET_ACCESS_KEY = 'AWS_SECRET_ACCESS_KEY',
  AWS_REGION = 'AWS_REGION',
}

interface ISuppliedVariables {
  clientDomain: string;
  mongoDbURI: string;
  jwtSecret: string;
  nodeEnv: string;
  port: string;
  S3Bucket: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
}

interface IStaticVariables {
  appName: string;
  appDefaultEmailAddressFrom: string;
  awsEmailEncoding: string;
  dateFormat: string;
  clientLoginLink: string;
  clientSignupLink: string;
  changePasswordPath: string;
  verifyEmailPath: string;
}

export interface IAppVariables extends ISuppliedVariables, IStaticVariables {}

const extractSchema: Record<
  keyof ISuppliedVariables,
  {
    required: boolean;
    name: AppEnvVariables;
    defaultValue?: string;
  }
> = {
  clientDomain: {
    required: false,
    name: AppEnvVariables.CLIENT_DOMAIN,
    // defaultValue: 'https://www.files-by-softkave.com',
    defaultValue: 'https://files.softkave.com',
  },
  mongoDbURI: {
    required: true,
    name: AppEnvVariables.MONGODB_URI,
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
};

export const defaultStaticVars = {
  appName: 'Files by Softkave',
  appDefaultEmailAddressFrom: 'hello@files.softkave.com',
  awsEmailEncoding: 'UTF-8',
  dateFormat: 'MMM DD, YYYY',
  changePasswordPath: '/change-password',
  verifyEmailPath: '/verify-email',
};

// Cast here is safe as long as nobody uses appVariables directly but through
// getAppVariables where the required variables are checked
let appVariables: IAppVariables = cast({
  ...defaultStaticVars,
});

export function checkRequiredSuppliedVariables(base: IAppVariables) {
  // [Env name, key name]
  const missingVariables: Array<[string, string]> = [];
  Object.keys(extractSchema).forEach(key => {
    const meta = extractSchema[key as keyof ISuppliedVariables];

    if (meta.required && !base[key as keyof ISuppliedVariables]) {
      missingVariables.push([meta.name, key]);
    }
  });

  if (missingVariables.length > 0) {
    throw new Error(
      ['Missing variables:']
        .concat(
          missingVariables.map(
            ([name, key]) => `Env name: ${name}, Key: ${key}`
          )
        )
        .join('\n')
    );
  }
}

export function extractEnvVariables(
  base: Partial<IAppVariables> = {}
): IAppVariables {
  const envVariables = Object.keys(extractSchema).reduce((accumulator, key) => {
    const meta = extractSchema[key as keyof ISuppliedVariables];
    const variable =
      process.env[meta.name] ||
      base[key as keyof ISuppliedVariables] ||
      meta.defaultValue;

    // TODO: validate the type or write/find a library for
    // extracting and validating env variables
    accumulator[key as keyof ISuppliedVariables] = variable as string;
    return accumulator;
  }, {} as ISuppliedVariables);

  const vars: IAppVariables = {
    ...defaultStaticVars,
    clientLoginLink: `${envVariables.clientDomain}/login`,
    clientSignupLink: `${envVariables.clientDomain}/signup`,
    ...base,
    ...envVariables,
  };

  return vars;
}

export function setAppVariables(base: Partial<IAppVariables>) {
  appVariables = merge({}, appVariables, base);
}

export function getAppVariables(extractFromEnv = true) {
  if (extractFromEnv) {
    setAppVariables(extractEnvVariables());
  }

  checkRequiredSuppliedVariables(appVariables);
  return appVariables;
}
