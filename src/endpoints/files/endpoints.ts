import deleteFile from './deleteFile/handler';
import {
  deleteFileEndpointDefinition,
  getFileDetailsEndpointDefinition,
  readFileEndpointDefinition,
  updateFileDetailsEndpointDefinition,
  uploadFileEndpointDefinition,
} from './endpoints.mddoc';
import getFileDetails from './getFileDetails/handler';
import readFile from './readFile/handler';
import {FilesExportedEndpoints} from './types';
import updateFileDetails from './updateFileDetails/handler';
import uploadFile from './uploadFile/handler';

export const filesExportedEndpoints: FilesExportedEndpoints = {
  deleteFile: {
    fn: deleteFile,
    mddocHttpDefinition: deleteFileEndpointDefinition,
  },
  getFileDetails: {
    fn: getFileDetails,
    mddocHttpDefinition: getFileDetailsEndpointDefinition,
  },
  readFile: {
    fn: readFile,
    mddocHttpDefinition: readFileEndpointDefinition,
  },
  updateFileDetails: {
    fn: updateFileDetails,
    mddocHttpDefinition: updateFileDetailsEndpointDefinition,
  },
  uploadFile: {
    fn: uploadFile,
    mddocHttpDefinition: uploadFileEndpointDefinition,
  },
};
