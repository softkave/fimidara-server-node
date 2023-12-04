import {endpointConstants} from '../constants';

export const fileBackendConstants = {
  routes: {
    addConfig: `${endpointConstants.apiv1}/fileBackends/addConfig`,
    updateConfig: `${endpointConstants.apiv1}/fileBackends/updateConfig`,
    deleteConfig: `${endpointConstants.apiv1}/fileBackends/deleteConfig`,
    getConfigs: `${endpointConstants.apiv1}/fileBackends/getConfigs`,
    getConfig: `${endpointConstants.apiv1}/fileBackends/getConfig`,
    countConfigs: `${endpointConstants.apiv1}/fileBackends/countConfigs`,

    addMount: `${endpointConstants.apiv1}/fileBackends/addMount`,
    updateMount: `${endpointConstants.apiv1}/fileBackends/updateMount`,
    deleteMount: `${endpointConstants.apiv1}/fileBackends/deleteMount`,
    getMounts: `${endpointConstants.apiv1}/fileBackends/getMounts`,
    getMount: `${endpointConstants.apiv1}/fileBackends/getMount`,
    countMounts: `${endpointConstants.apiv1}/fileBackends/countMounts`,
    resolveMounts: `${endpointConstants.apiv1}/fileBackends/resolveMounts`,
  },
};
