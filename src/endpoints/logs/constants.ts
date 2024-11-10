import {kEndpointConstants} from '../constants.js';

const clientLogsConstants = {
  maxMessageLength: 500,
  maxStackLength: 2000,
  maxBatch: 100,
  maxLevelLength: 20,
  maxServiceNameLength: 100,
  routes: {
    ingestLogs: `${kEndpointConstants.apiv1}/clientLogs/ingestLogs`,
  },
};

export default clientLogsConstants;
