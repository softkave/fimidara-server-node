import {memoize} from 'lodash-es';
import jsonStringify from 'safe-stable-stringify';
import {AnyObject} from 'softkave-js-utils';
import {createLogger, format, transports} from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const consoleTransport = new transports.Console({
  format: format.printf(info => {
    const {message, metadata, level} = info;
    const {timestamp, service, ...rest} = metadata;

    // TODO: json stringify can be a perf bottleneck
    const stringifiedRest = jsonStringify(rest, null, 2);
    if (stringifiedRest !== '{}') {
      return `${timestamp} [${service}] ${level}: ${message} \n${stringifiedRest}`;
    } else {
      return `${timestamp} [${service}] ${level}: ${message}`;
    }
  }),
});

export interface ICreateAppLoggerOptions {
  transports: Array<'console' | 'file'>;
  meta: {service: string} & AnyObject;
}

export const createAppLogger = memoize(
  (opts: ICreateAppLoggerOptions) => {
    const logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp({format: 'YYYY-MM-DDTHH:mm:ssZ'}),
        format.errors({stack: true}),
        format.metadata(),
        format.json()
      ),
      defaultMeta: opts.meta,
      transports: [],
    });

    opts.transports.forEach(transport => {
      switch (transport) {
        case 'console':
          logger.add(consoleTransport);
          break;
        case 'file': {
          const infoFileTransport: DailyRotateFile = new DailyRotateFile({
            // TODO: read from config
            dirname: './runtime-logs',
            filename: `${opts.meta.service}.winston.log.%DATE%`,
          });
          const errorFileTransport: DailyRotateFile = new DailyRotateFile({
            // TODO: read from config
            filename: `${opts.meta.service}.winston.error.%DATE%`,
            dirname: './runtime-logs',
            level: 'error',
          });
          logger.add(infoFileTransport).add(errorFileTransport);
          break;
        }
      }
    });

    return logger;
  },
  opts => opts.meta.service
);
