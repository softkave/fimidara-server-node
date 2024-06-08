import {populateMountUnsupportedOpNoteInNotFoundError} from '../fileBackends/mountUtils.js';
import {ExportedHttpEndpoint_HandleErrorFn} from '../types.js';
import {
  getPresignedPathsForFilesEndpointDefinition,
  issuePresignedPathEndpointDefinition,
} from './endpoints.mddoc.js';
import getPresignedPathsForFiles from './getPresignedPaths/handler.js';
import issuePresignedPath from './issuePresignedPath/handler.js';
import {PresignedPathsExportedEndpoints} from './types.js';

const handleNotFoundError: ExportedHttpEndpoint_HandleErrorFn = (
  res,
  proccessedErrors
) => {
  populateMountUnsupportedOpNoteInNotFoundError(proccessedErrors);

  // populate notes only, and defer handling to server
  return true;
};

export function getPresignedPathsPublicHttpEndpoints() {
  const presignedPathsExportedEndpoints: PresignedPathsExportedEndpoints = {
    issuePresignedPath: {
      fn: issuePresignedPath,
      mddocHttpDefinition: issuePresignedPathEndpointDefinition,
      handleError: handleNotFoundError,
    },
    getPresignedPathsForFiles: {
      fn: getPresignedPathsForFiles,
      mddocHttpDefinition: getPresignedPathsForFilesEndpointDefinition,
      handleError: handleNotFoundError,
    },
  };
  return presignedPathsExportedEndpoints;
}
