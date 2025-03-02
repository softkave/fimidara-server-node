import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {IngestLogsEndpoint} from './types.js';
import {ingestLogsJoiSchema} from './validation.js';

const ingestLogs: IngestLogsEndpoint = async reqData => {
  const data = validate(reqData.data, ingestLogsJoiSchema);
  data.logs.forEach(log => kIjxUtils.logger().log(log));
};

export default ingestLogs;
