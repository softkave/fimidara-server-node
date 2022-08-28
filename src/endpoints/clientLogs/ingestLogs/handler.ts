import {
  FimidaraLoggerServiceNames,
  loggerFactory,
} from '../../../utilities/logger/loggerUtils';
import {validate} from '../../../utilities/validate';
import {IngestLogsEndpoint} from './types';
import {ingestLogsJoiSchema} from './validation';

const ingestLogs: IngestLogsEndpoint = async (context, instData) => {
  const data = validate(instData.data, ingestLogsJoiSchema);
  const logger = loggerFactory({
    meta: {service: FimidaraLoggerServiceNames.WebClient},
    transports: ['mongodb'],
  });
  data.logs.forEach(log => logger.log(log));
};

export default ingestLogs;
