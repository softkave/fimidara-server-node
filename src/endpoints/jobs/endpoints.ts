import {kEndpointTag} from '../types.js';
import {getJobStatusEndpointDefinition} from './endpoints.mddoc.js';
import getJobStatus from './getJobStatus/handler.js';
import {JobsExportedEndpoints} from './types.js';

export function getJobsHttpEndpoints() {
  const jobsExportedEndpoints: JobsExportedEndpoints = {
    getJobStatus: {
      tag: [kEndpointTag.public],
      fn: getJobStatus,
      mddocHttpDefinition: getJobStatusEndpointDefinition,
    },
  };
  return jobsExportedEndpoints;
}
