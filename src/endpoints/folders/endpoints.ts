import addFolder from './addFolder/handler';
import deleteFolder from './deleteFolder/handler';
import {
  addFolderEndpointDefinition,
  deleteFolderEndpointDefinition,
  getFolderEndpointDefinition,
  listFolderContentEndpointDefinition,
  updateFolderEndpointDefinition,
} from './endpoints.mddoc';
import getFolder from './getFolder/handler';
import listFolderContent from './listFolderContent/handler';
import {FoldersExportedEndpoints} from './types';
import updateFolder from './updateFolder/handler';

export const foldersExportedEndpoints: FoldersExportedEndpoints = {
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
  updateFolder: {
    fn: updateFolder,
    mddocHttpDefinition: updateFolderEndpointDefinition,
  },
};
