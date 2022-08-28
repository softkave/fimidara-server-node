import jsonStringify from 'safe-stable-stringify';
import {createLogger, format, transports} from 'winston';
import {MongoDBTransportInstance} from 'winston-mongodb';
import {extractEnvVariables, extractProdEnvsSchema} from '../../resources/vars';
import {AnyObject} from '../types';

require('winston-mongodb');

const vars = extractEnvVariables(extractProdEnvsSchema);
export const consoleTransport = new transports.Console({
  format: format.combine(
    format.colorize(),
    format.printf(info => {
      const {level, message, timestamp, service, ...rest} = info;
      const stringifiedRest = jsonStringify(rest, null, 2);
      if (stringifiedRest !== '{}') {
        return `${timestamp} [${service}]: ${level}: ${message} \n${stringifiedRest}`;
      } else {
        return `${timestamp} [${service}]: ${level}: ${message}`;
      }
    })
  ),
});

export const defaultLoggerFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DDTHH:mm:ssZ',
  }),
  format.errors({stack: true}),
  format.metadata(),
  format.json()
);

export interface ICreateLoggerOptions {
  transports: Array<'console' | 'mongodb'>;
  meta: {
    service: string;
  } & AnyObject;
}

let dbTransport: MongoDBTransportInstance | null = null;
function getDbTransport() {
  if (dbTransport) {
    return dbTransport;
  }

  const mongoURL = new URL(vars.logsDbName, vars.mongoDbURI);
  dbTransport = new transports.MongoDB({
    db: mongoURL.toString(),
    collection: vars.logsCollectionName,
    storeHost: true,
  });

  return dbTransport;
}

export function loggerFactory(opts: ICreateLoggerOptions) {
  const logger = createLogger({
    level: 'info',
    format: defaultLoggerFormat,
    defaultMeta: opts.meta,
    transports: [],
  });

  opts.transports.forEach(tr => {
    switch (tr) {
      case 'console':
        logger.add(consoleTransport);
        break;
      case 'mongodb':
        logger.add(getDbTransport());
        break;
    }
  });

  return logger;
}

export function disposeDbTransport() {
  if (dbTransport) {
    if (dbTransport.close) {
      dbTransport.close();
    }
    dbTransport = null;
  }
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
