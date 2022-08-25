import {format, transports} from 'winston';

export const consoleTransport = new transports.Console({
  format: format.combine(format.colorize(), format.simple()),
});

export const loggerFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  format.errors({stack: true}),
  format.json()
);

export const loggerServiceName = 'fimidara-server';
