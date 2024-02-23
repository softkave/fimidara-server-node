import {populateMountUnsupportedOpNoteInNotFoundError} from '../fileBackends/mountUtils';
import {ExportedHttpEndpoint_HandleErrorFn} from '../types';
import {
  getPresignedPathsForFilesEndpointDefinition,
  issuePresignedPathEndpointDefinition,
} from './endpoints.mddoc';
import getPresignedPathsForFiles from './getPresignedPaths/handler';
import issuePresignedPath from './issuePresignedPath/handler';
import {PresignedPathsExportedEndpoints} from './types';

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
