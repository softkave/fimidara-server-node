import {loggerFactory} from '../utils/logger/loggerUtils';

export const jestLogger = loggerFactory({
  transports: ['console'],
  meta: {service: 'fimidara-test'},
});
