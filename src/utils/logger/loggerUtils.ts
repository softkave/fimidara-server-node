import jsonStringify from 'safe-stable-stringify';
import {createLogger, format, transports} from 'winston';
import 'winston-mongodb';
import {extractEnvVariables, extractProdEnvsSchema} from '../../resources/vars';
import {AnyObject} from '../types';

const vars = extractEnvVariables(extractProdEnvsSchema);
export const consoleTransport = new transports.Console({
  format: format.combine(
    format.colorize(),
    format.printf(info => {
      const {message, metadata, level} = info;
      const {timestamp, service, ...rest} = metadata;
      const stringifiedRest = jsonStringify(rest, null, 2);
      if (stringifiedRest !== '{}') {
        return `${timestamp} [${service}]: ${level}: ${message} \n${stringifiedRest}`;
      } else {
        return `${timestamp} [${service}]: ${level}: ${message}`;
      }
    })
  ),
});

export interface ICreateLoggerOptions {
  transports: Array<'console' | 'mongodb'>;
  meta: {
    service: string;
  } & AnyObject;
}

export function loggerFactory(opts: ICreateLoggerOptions) {
  const logger = createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DDTHH:mm:ssZ',
      }),
      format.errors({stack: true}),
      format.metadata(),
      format.json()
    ),
    defaultMeta: opts.meta,
    transports: [],
  });

  opts.transports.forEach(tr => {
    switch (tr) {
      case 'console':
        logger.add(consoleTransport);
        break;
      case 'mongodb':
        {
          const mongoURL = new URL(vars.logsDbName, vars.mongoDbURI);
          const dbTransport = new transports.MongoDB({
            db: mongoURL.toString(),
            collection: vars.logsCollectionName,
            storeHost: true,
            options: {useUnifiedTopology: true},
          });
          logger.add(dbTransport);
        }
        break;
    }
  });

  return logger;
}

export function decideTransport(): ICreateLoggerOptions['transports'] {
  return vars.nodeEnv === 'production' ? ['mongodb'] : ['console', 'mongodb'];
}

export enum FimidaraLoggerServiceNames {
  Server = 'fimidara-server',
  Script = 'fimidara-script',
  Pipeline = 'fimidara-pipeline',
  WebClient = 'fimidara-web',
  Test = 'fimidara-test',
}