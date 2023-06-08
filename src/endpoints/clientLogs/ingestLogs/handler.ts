import {webLogger} from '../../../utils/logger/loggerUtils';
import {validate} from '../../../utils/validate';
import {IngestLogsEndpoint} from './types';
import {ingestLogsJoiSchema} from './validation';

const ingestLogs: IngestLogsEndpoint = async (context, instData) => {
  const data = validate(instData.data, ingestLogsJoiSchema);
  data.logs.forEach(log => webLogger.log(log));
};

export default ingestLogs;
