import {endpointConstants} from '../constants';

export const fileConstants = {
  maxFileSizeInBytes: 200 * 1024 ** 2, // 200Mb
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
