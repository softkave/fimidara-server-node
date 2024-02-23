import {ConnectBusboyOptions} from 'connect-busboy';
import {kEndpointConstants} from '../constants';

const maxFileSizeInBytes = 1024 * 1024 ** 2; // 2Gb
const multipartLimits: ConnectBusboyOptions['limits'] = {
  fields: 1,
  files: 1,
  fieldSize: maxFileSizeInBytes,
  fileSize: maxFileSizeInBytes,
};
export const kFileConstants = {
  maxFileSizeInBytes,
  multipartLimits,
  nameExtensionSeparator: '.',
  maxMimeTypeCharLength: 100,
  maxEncodingCharLength: 100,
  maxExtensionCharLength: 100,
  maxFileWidth: 5000, // px
  maxFileHeight: 5000, // px
  uploadedFileFieldName: 'data',
  routes: {
    readFile: `${kEndpointConstants.apiv1}/files/readFile`,
    readFile_get: `${kEndpointConstants.apiv1}/files/readFile/:filepathOrId`,
    deleteFile: `${kEndpointConstants.apiv1}/files/deleteFile`,
    getFileDetails: `${kEndpointConstants.apiv1}/files/getFileDetails`,
    updateFileDetails: `${kEndpointConstants.apiv1}/files/updateFileDetails`,
    uploadFile: `${kEndpointConstants.apiv1}/files/uploadFile`,
    // TODO: better implement divide between express paths and mddoc def
    uploadFile_post: `${kEndpointConstants.apiv1}/files/uploadFile/:filepathOrId`,
  },
  headers: {
    'x-fimidara-file-description': 'x-fimidara-file-description',
    'x-fimidara-file-mimetype': 'x-fimidara-file-mimetype',
  } as const,
};
