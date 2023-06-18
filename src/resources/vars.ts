import {readFileSync} from 'fs';
import {forEach, isBoolean, isString, isUndefined} from 'lodash';
import {UnionToIntersection} from 'type-fest';
import {getFirstArg} from '../utils/fns';
import {AnyFn, AnyObject} from '../utils/types';
import {
  AppEnvVariables,
  FileBackendType,
  FimidaraConfig,
  FimidaraConfigSchema,
  FimidaraRuntimeConfig,
  InputFimidaraConfig,
  InputFimidaraConfigItem,
} from './types';
import Joi = require('joi');
import assert = require('assert');

const configItemValidationSchema = Joi.alternatives().try(
  Joi.object<InputFimidaraConfigItem>().keys({
    envName: Joi.string().max(300).required(),
  }),
  Joi.object<InputFimidaraConfigItem>().keys({
    value: Joi.any().required(),
  })
);
const configValidationSchema = Joi.object<InputFimidaraConfig>()
  .keys({
    clientDomain: configItemValidationSchema.required(),
    mongoDbURI: configItemValidationSchema.required(),
    mongoDbDatabaseName: configItemValidationSchema.required(),
    jwtSecret: configItemValidationSchema.required(),
    nodeEnv: configItemValidationSchema.required(),
    port: configItemValidationSchema.required(),
    S3Bucket: configItemValidationSchema.required(),
    awsAccessKeyId: configItemValidationSchema.required(),
    awsSecretAccessKey: configItemValidationSchema.required(),
    awsRegion: configItemValidationSchema.required(),
    rootUserEmail: configItemValidationSchema.required(),
    rootUserFirstName: configItemValidationSchema.required(),
    rootUserLastName: configItemValidationSchema.required(),
    fileBackend: configItemValidationSchema.required(),
    FLAG_waitlistNewSignups: configItemValidationSchema.required(),
    localFsDir: configItemValidationSchema.required(),
    appName: configItemValidationSchema.required(),
    appDefaultEmailAddressFrom: configItemValidationSchema.required(),
    awsEmailEncoding: configItemValidationSchema.required(),
    dateFormat: configItemValidationSchema.required(),
    clientLoginLink: configItemValidationSchema.required(),
    clientSignupLink: configItemValidationSchema.required(),
    changePasswordLink: configItemValidationSchema.required(),
    verifyEmailLink: configItemValidationSchema.required(),
  })
  .required();

export const configSchema: FimidaraConfigSchema = {
  mongoDbURI: {required: true},
  mongoDbDatabaseName: {required: true},
  jwtSecret: {required: true},
  nodeEnv: {required: false, defaultValue: 'development'},
  port: {required: false, defaultValue: '5000'},
  S3Bucket: {required: true},
  awsAccessKeyId: {required: true},
  awsSecretAccessKey: {required: true},
  awsRegion: {required: true},
  rootUserEmail: {required: true},
  rootUserFirstName: {required: true},
  rootUserLastName: {required: true},
  fileBackend: {required: true, defaultValue: FileBackendType.S3},
  FLAG_waitlistNewSignups: {
    required: false,
    defaultValue: false,
    transform: (data => data === 'true') as AnyFn,
    validator: isBoolean,
  },
  clientDomain: {required: false, defaultValue: 'https://www.fimidara.com'},
  changePasswordLink: {required: true},
  clientLoginLink: {required: true},
  clientSignupLink: {required: true},
  verifyEmailLink: {required: true},
  localFsDir: {required: false},
  appDefaultEmailAddressFrom: {required: false, defaultValue: 'fimidara@softkave.com'},
  appName: {required: false, defaultValue: 'fimidara'},
  awsEmailEncoding: {required: false, defaultValue: 'UTF-8'},
  dateFormat: {required: false, defaultValue: 'MMM DD, YYYY'},
  serverInstanceId: {required: false, defaultValue: 'main_000'},
};

type EnvProcessFn<T extends any = any> = (value: any, envName: string) => T;

function fromEnv(envName: string) {
  return process.env[envName];
}

function getRequired<T extends any = any>(
  envName: string,
  processFn: EnvProcessFn<T> = getFirstArg
): ReturnType<typeof processFn> {
  const value = fromEnv(envName);
  assert(!isUndefined(value), `${envName} is required.`);
  return processFn(value, envName);
}

function getAndParseConfigFile() {
  const configFilepath = getRequired(AppEnvVariables.CONFIG_FILE_PATH);
  const configRaw = readFileSync(configFilepath, 'utf-8');
  const configJson = JSON.parse(configRaw);
  configValidationSchema.validate(configJson);
  return configJson as InputFimidaraConfig;
}

function checkRequiredSuppliedConfig(base: FimidaraConfig) {
  // [Env name, error message]
  const validationErrors: Array<[string, string]> = [];
  const missingVariables: Array<string> = [];

  Object.keys(configSchema).forEach(key => {
    const meta = configSchema[key as keyof FimidaraConfigSchema];
    let value = base[key as keyof FimidaraConfig];

    if (!meta) throw new Error(`Unknown env var key ${key}`);
    if (meta.required && !value) missingVariables.push(key);
    if (value && meta.transform) value = (base as any)[key] = meta.transform(value as string);
    if (meta.validator) {
      const validationResult = meta.validator(value);
      if (isString(validationResult)) validationErrors.push([key, validationResult]);
      else if (validationResult === false) validationErrors.push([key, `'${value}' is invalid.`]);
    }
  });

  let errorMessage = '';

  if (missingVariables.length) {
    errorMessage += ['Missing variables:']
      .concat(missingVariables.map(([name, key]) => `Env name: ${name}, Key: ${key}`))
      .join('\n');
  }
  if (validationErrors.length) {
    errorMessage += ['Invalid variables:']
      .concat(validationErrors.map(([name, message]) => `Env name: ${name}, Message: ${message}`))
      .join('\n');
  }

  if (errorMessage) throw new Error(errorMessage);
}

export function compileConfigFromFile() {
  const configJson = getAndParseConfigFile();
  const dummyRuntimeConfig: FimidaraRuntimeConfig = {
    // Added after the app initialization phase
    appWorkspaceId: '',
    appWorkspacesImageUploadPermissionGroupId: '',
    appUsersImageUploadPermissionGroupId: '',
  };
  const config: AnyObject = {...dummyRuntimeConfig};

  forEach(configJson, (item, field) => {
    const configItem = item as UnionToIntersection<InputFimidaraConfigItem>;
    if (configItem.envName) {
      config[field] = process.env[configItem.envName];
    } else {
      config[field] = configItem.value;
    }
  });

  checkRequiredSuppliedConfig(config as FimidaraConfig);
  return config as FimidaraConfig;
}

export const fimidaraConfig = compileConfigFromFile();
