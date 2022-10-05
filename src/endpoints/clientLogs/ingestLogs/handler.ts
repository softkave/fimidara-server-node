import {validate} from '../../../utilities/validate';
import {IngestLogsEndpoint} from './types';
import {ingestLogsJoiSchema} from './validation';

const ingestLogs: IngestLogsEndpoint = async (context, instData) => {
  const data = validate(instData.data, ingestLogsJoiSchema);
  data.logs.forEach(log => context.clientLogger.log(log));
};

export default ingestLogs;
