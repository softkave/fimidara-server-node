import {populateMountUnsupportedOpNoteInNotFoundError} from '../fileBackends/mountUtils.js';
import {ExportedHttpEndpoint_HandleErrorFn} from '../types.js';
import addFolder from './addFolder/handler.js';
import countFolderContent from './countFolderContent/handler.js';
import deleteFolder from './deleteFolder/handler.js';
import {
  addFolderEndpointDefinition,
  countFolderContentEndpointDefinition,
  deleteFolderEndpointDefinition,
  getFolderEndpointDefinition,
  listFolderContentEndpointDefinition,
  updateFolderEndpointDefinition,
} from './endpoints.mddoc.js';
import getFolder from './getFolder/handler.js';
import listFolderContent from './listFolderContent/handler.js';
import {FoldersExportedEndpoints} from './types.js';
import updateFolder from './updateFolder/handler.js';

const handleNotFoundError: ExportedHttpEndpoint_HandleErrorFn = (
  res,
  proccessedErrors
) => {
  populateMountUnsupportedOpNoteInNotFoundError(proccessedErrors);

  // populate notes only, and defer handling to server
  return true;
};

export function getFoldersPublicHttpEndpoints() {
  const foldersExportedEndpoints: FoldersExportedEndpoints = {
    addFolder: {
      fn: addFolder,
      mddocHttpDefinition: addFolderEndpointDefinition,
      handleError: handleNotFoundError,
    },
    deleteFolder: {
      fn: deleteFolder,
      mddocHttpDefinition: deleteFolderEndpointDefinition,
      handleError: handleNotFoundError,
    },
    getFolder: {
      fn: getFolder,
      mddocHttpDefinition: getFolderEndpointDefinition,
      handleError: handleNotFoundError,
    },
    listFolderContent: {
      fn: listFolderContent,
      mddocHttpDefinition: listFolderContentEndpointDefinition,
      handleError: handleNotFoundError,
    },
    countFolderContent: {
      fn: countFolderContent,
      mddocHttpDefinition: countFolderContentEndpointDefinition,
      handleError: handleNotFoundError,
    },
    updateFolder: {
      fn: updateFolder,
      mddocHttpDefinition: updateFolderEndpointDefinition,
      handleError: handleNotFoundError,
    },
  };

  return foldersExportedEndpoints;
}
