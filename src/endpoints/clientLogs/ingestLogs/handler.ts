import {validate} from '../../../utils/validate.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {IngestLogsEndpoint} from './types.js';
import {ingestLogsJoiSchema} from './validation.js';

const ingestLogs: IngestLogsEndpoint = async instData => {
  const data = validate(instData.data, ingestLogsJoiSchema);
  data.logs.forEach(log => kUtilsInjectables.logger().log(log));
};

export default ingestLogs;
