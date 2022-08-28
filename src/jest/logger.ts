import {loggerFactory} from '../utilities/logger/loggerUtils';

export const jestLogger = loggerFactory({
  transports: ['console'],
  meta: {service: 'fimidara-test'},
});
