import {endpointConstants} from '../constants';

export const fileBackendConstants = {
  routes: {
    configBackend: `${endpointConstants.apiv1}/fileBackends/configBackend`,
    deleteConfig: `${endpointConstants.apiv1}/fileBackends/deleteConfig`,
    addMount: `${endpointConstants.apiv1}/fileBackends/addMount`,
    deleteMount: `${endpointConstants.apiv1}/fileBackends/deleteMount`,
    ingestMount: `${endpointConstants.apiv1}/fileBackends/ingestMount`,
    getConfigs: `${endpointConstants.apiv1}/fileBackends/getConfigs`,
    getConfig: `${endpointConstants.apiv1}/fileBackends/getConfig`,
    countConfigs: `${endpointConstants.apiv1}/fileBackends/countConfigs`,
    getMounts: `${endpointConstants.apiv1}/fileBackends/getMounts`,
    getMount: `${endpointConstants.apiv1}/fileBackends/getMount`,
    countMounts: `${endpointConstants.apiv1}/fileBackends/countMounts`,
  },
};
