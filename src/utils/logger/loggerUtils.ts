import assert from 'assert';
import jsonStringify from 'safe-stable-stringify';
import {createLogger, format, transports} from 'winston';
import 'winston-mongodb';
import {getAppVariables, prodEnvsSchema} from '../../resources/vars';
import {AnyObject} from '../types';

const vars = getAppVariables(prodEnvsSchema);
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
          const dbTransport = new transports.MongoDB({
            db: vars.mongoDbURI,
            dbName: vars.logsDbName,
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
  if (vars.nodeEnv === 'production') {
    assert(vars.mongoDbURI);
    return ['mongodb'];
  } else {
    if (vars.mongoDbURI) {
      return ['console', 'mongodb'];
    } else {
      return ['console'];
    }
  }
}

export enum FimidaraLoggerServiceNames {
  Server = 'fimidara-server',
  Script = 'fimidara-script',
  Pipeline = 'fimidara-pipeline',
  WebClient = 'fimidara-web',
  Test = 'fimidara-test',
}
