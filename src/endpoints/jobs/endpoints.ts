import {getJobStatusEndpointDefinition} from './endpoints.mddoc.js';
import getJobStatus from './getJobStatus/handler.js';
import {JobsExportedEndpoints} from './types.js';

export function getJobsPublicHttpEndpoints() {
  const jobsExportedEndpoints: JobsExportedEndpoints = {
    getJobStatus: {
      fn: getJobStatus,
      mddocHttpDefinition: getJobStatusEndpointDefinition,
    },
  };
  return jobsExportedEndpoints;
}
