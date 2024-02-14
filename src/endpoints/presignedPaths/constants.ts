import {kEndpointConstants} from '../constants';

export const kPresignedPathsConstants = {
  routes: {
    issuePresignedPath: `${kEndpointConstants.apiv1}/presignedPaths/issuePresignedPath`,
    getPresignedPaths: `${kEndpointConstants.apiv1}/presignedPaths/getPresignedPaths`,
  },
};
