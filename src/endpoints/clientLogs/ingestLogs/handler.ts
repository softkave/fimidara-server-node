import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {IngestLogsEndpoint} from './types';
import {ingestLogsJoiSchema} from './validation';

const ingestLogs: IngestLogsEndpoint = async instData => {
  const data = validate(instData.data, ingestLogsJoiSchema);
  data.logs.forEach(log => kUtilsInjectables.logger().log(log));
};

export default ingestLogs;
