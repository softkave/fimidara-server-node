import {getJobStatusEndpointDefinition} from './endpoints.mddoc';
import getJobStatus from './getJobStatus/handler';
import {JobsExportedEndpoints} from './types';

export function getJobsPublicHttpEndpoints() {
  const jobsExportedEndpoints: JobsExportedEndpoints = {
    getJobStatus: {
      fn: getJobStatus,
      mddocHttpDefinition: getJobStatusEndpointDefinition,
    },
  };
  return jobsExportedEndpoints;
}
