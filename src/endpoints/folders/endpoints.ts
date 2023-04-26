import addFolder from './addFolder/handler';
import countFolderContent from './countFolderContent/handler';
import deleteFolder from './deleteFolder/handler';
import {
  addFolderEndpointDefinition,
  countFolderContentEndpointDefinition,
  deleteFolderEndpointDefinition,
  getFolderEndpointDefinition,
  listFolderContentEndpointDefinition,
  updateFolderEndpointDefinition,
} from './endpoints.mddoc';
import getFolder from './getFolder/handler';
import listFolderContent from './listFolderContent/handler';
import {FoldersExportedEndpoints} from './types';
import updateFolder from './updateFolder/handler';

export function getFoldersPublicHttpEndpoints() {
  const foldersExportedEndpoints: FoldersExportedEndpoints = {
    addFolder: {
      fn: addFolder,
      mddocHttpDefinition: addFolderEndpointDefinition,
    },
    deleteFolder: {
      fn: deleteFolder,
      mddocHttpDefinition: deleteFolderEndpointDefinition,
    },
    getFolder: {
      fn: getFolder,
      mddocHttpDefinition: getFolderEndpointDefinition,
    },
    listFolderContent: {
      fn: listFolderContent,
      mddocHttpDefinition: listFolderContentEndpointDefinition,
    },
    countFolderContent: {
      fn: countFolderContent,
      mddocHttpDefinition: countFolderContentEndpointDefinition,
    },
    updateFolder: {
      fn: updateFolder,
      mddocHttpDefinition: updateFolderEndpointDefinition,
    },
  };

  return foldersExportedEndpoints;
}
