import {URL} from 'url';
import {createLogger, transports} from 'winston';
import {extractEnvVariables, extractProdEnvsSchema} from '../../resources/vars';
import {consoleTransport, loggerFormat, loggerServiceName} from './loggerUtils';

require('winston-mongodb');

const vars = extractEnvVariables(extractProdEnvsSchema);
const mongoURL = new URL(vars.logsDbName, vars.mongoDbURI);
const dbTransport = new transports.MongoDB({
  db: mongoURL.toString(),
  collection: vars.logsCollectionName,
  storeHost: true,
});

export const logger = createLogger({
  level: 'info',
  format: loggerFormat,
  defaultMeta: {service: loggerServiceName},
  transports: [dbTransport],
});

if (vars.nodeEnv !== 'production') {
  logger.add(consoleTransport);
}
