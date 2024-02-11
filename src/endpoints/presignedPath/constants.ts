import {ConnectBusboyOptions} from 'connect-busboy';
import {kEndpointConstants} from '../constants';

const maxFileSizeInBytes = 1024 * 1024 ** 2; // 2Gb
const multipartLimits: ConnectBusboyOptions['limits'] = {
  fields: 10,
  fileSize: maxFileSizeInBytes,
  files: 1,
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
    deleteFile: `${kEndpointConstants.apiv1}/files/deleteFile`,
    getFileDetails: `${kEndpointConstants.apiv1}/files/getFileDetails`,
    updateFileDetails: `${kEndpointConstants.apiv1}/files/updateFileDetails`,
    uploadFile: `${kEndpointConstants.apiv1}/files/uploadFile`,
    issuePresignedPath: `${kEndpointConstants.apiv1}/files/issuePresignedPath`,
    getPresignedPaths: `${kEndpointConstants.apiv1}/files/getPresignedPaths`,
  },
  headers: {
    'x-fimidara-file-description': 'x-fimidara-file-description',
    'x-fimidara-file-mimetype': 'x-fimidara-file-mimetype',
  } as const,
};
