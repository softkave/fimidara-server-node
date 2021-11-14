interface IEnvVariables {
  clientDomain: string;
  mongoDbURI: string;
  jwtSecret: string;
  nodeEnv: string;
  port: string;
  twilioAccountSID: string;
  twilioAuthToken: string;
  twilioVerificationServiceSID: string;
  S3Bucket: string;
}

export interface IAppVariables extends IEnvVariables {
  appName: string;
  emailSenderId: string;
  awsEmailEncoding: string;
  dateFormat: string;
  clientLoginLink: string;
  clientSignupLink: string;
  changePasswordPath: string;
  verifyEmailPath: string;
}

const extractSchema: Record<
  keyof IEnvVariables,
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
  twilioAccountSID: {
    required: true,
    name: 'TWILIO_ACCOUNT_SID',
  },
  twilioAuthToken: {
    required: true,
    name: 'TWILIO_AUTH_TOKEN',
  },
  twilioVerificationServiceSID: {
    required: true,
    name: 'TWILIO_VERIFY_SERVICE_SID',
  },
  S3Bucket: {
    required: true,
    name: 'S3_BUCKET',
  },
};

export function extractEnvVariables(): IAppVariables {
  const missingVariables: string[] = [];

  const envVariables = Object.keys(extractSchema).reduce((accumulator, key) => {
    const meta = extractSchema[key as keyof IEnvVariables];
    const variable = process.env[meta.name] || meta.defaultValue;

    if (meta.required && !variable) {
      missingVariables.push(meta.name);
      return accumulator;
    }

    // TODO: validate the type or write/find a library for
    // extracting and validating env variables
    accumulator[key as keyof IEnvVariables] = variable as string;
    return accumulator;
  }, {} as IEnvVariables);

  if (missingVariables.length > 0) {
    missingVariables.forEach(name => console.log(`${name} is required`));
    throw new Error('Missing env variables');
  }

  const appVariables: IAppVariables = {
    ...envVariables,
    appName: 'Shops by Softkave',
    emailSenderId: 'hello@shops.softkave.com',
    awsEmailEncoding: 'UTF-8',
    dateFormat: 'MMM DD, YYYY',
    clientLoginLink: `${envVariables.clientDomain}/login`,
    clientSignupLink: `${envVariables.clientDomain}/signup`,
    changePasswordPath: '/change-password',
    verifyEmailPath: '/verify-email',
  };

  return appVariables;
}

export const appVariables = extractEnvVariables();
