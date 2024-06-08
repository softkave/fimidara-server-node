import {kEndpointConstants} from '../constants.js';

export const kPresignedPathsConstants = {
  routes: {
    issuePresignedPath: `${kEndpointConstants.apiv1}/presignedPaths/issuePresignedPath`,
    getPresignedPaths: `${kEndpointConstants.apiv1}/presignedPaths/getPresignedPaths`,
  },
};
