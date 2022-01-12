import {merge} from 'lodash';
import cast from '../utilities/fns';

interface ISuppliedVariables {
  clientDomain: string;
  mongoDbURI: string;
  jwtSecret: string;
  nodeEnv: string;
  port: string;
  S3Bucket: string;
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

export type IAppVariables = ISuppliedVariables & IStaticVariables;

const extractSchema: Record<
  keyof ISuppliedVariables,
  {
    required: boolean;
    name: string;
    defaultValue?: string;
  }
> = {
  clientDomain: {
    required: false,
    name: 'CLIENT_DOMAIN',
    // defaultValue: 'https://www.files-by-softkave.com',
    defaultValue: 'https://files.softkave.com',
  },
  mongoDbURI: {
    required: true,
    name: 'MONGODB_URI',
  },
  jwtSecret: {
    required: true,
    name: 'JWT_SECRET',
  },
  nodeEnv: {
    required: false,
    name: 'NODE_ENV',
    defaultValue: 'development',
  },
  port: {
    required: true,
    name: 'PORT',
  },
  S3Bucket: {
    required: true,
    name: 'S3_BUCKET',
  },
};

const defaultStaticVars = {
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

let varsChecked = false;

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
  base: Partial<IAppVariables>
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

  checkRequiredSuppliedVariables(vars);
  return vars;
}

export function setAppVariables(base: Partial<IAppVariables>) {
  appVariables = merge({}, appVariables, base);
}

export function getAppVariables() {
  if (!varsChecked) {
    checkRequiredSuppliedVariables(appVariables);
    varsChecked = true;
  }

  return appVariables;
}
