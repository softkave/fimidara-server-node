import {endpointConstants} from '../constants';

const clientLogsConstants = {
  maxMessageLength: 500,
  maxStackLength: 2000,
  maxBatch: 100,
  maxLevelLength: 20,
  maxServiceNameLength: 100,
  routes: {
    ingestLogs: `${endpointConstants.apiv1}/clientLogs/ingestLogs`,
  },
};

export default clientLogsConstants;
