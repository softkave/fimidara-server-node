import {getJobStatusEndpointDefinition} from './endpoints.mddoc';
import getJobStatus from './getJobStatus/handler';
import {JobsExportedEndpoints} from './types';

export const jobsExportedEndpoints: JobsExportedEndpoints = {
  getJobStatus: {
    fn: getJobStatus,
    mddocHttpDefinition: getJobStatusEndpointDefinition,
  },
};
