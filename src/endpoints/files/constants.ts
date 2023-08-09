import {ConnectBusboyOptions} from 'connect-busboy';
import {endpointConstants} from '../constants';

const maxFileSizeInBytes = 1024 * 1024 ** 2; // 2Gb
const multipartLimits: ConnectBusboyOptions['limits'] = {
  fields: 10,
  fileSize: maxFileSizeInBytes,
  files: 1,
};
export const fileConstants = {
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
    readFile: `${endpointConstants.apiv1}/files/readFile`,
    deleteFile: `${endpointConstants.apiv1}/files/deleteFile`,
    getFileDetails: `${endpointConstants.apiv1}/files/getFileDetails`,
    updateFileDetails: `${endpointConstants.apiv1}/files/updateFileDetails`,
    uploadFile: `${endpointConstants.apiv1}/files/uploadFile`,
    issueFilePresignedPath: `${endpointConstants.apiv1}/files/issueFilePresignedPath`,
    getPresignedPathsForFiles: `${endpointConstants.apiv1}/files/getPresignedPathsForFiles`,
  },
  headers: {
    'x-fimidara-file-description': 'x-fimidara-file-description',
    'x-fimidara-file-mimetype': 'x-fimidara-file-mimetype',
  } as const,
};
