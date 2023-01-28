import {endpointConstants} from '../constants';

export const fileConstants = {
  maxFileSizeInBytes: 200 * 1024 ** 2, // 200Mb
  nameExtensionSeparator: '.',
  maxMimeTypeCharLength: 100,
  maxEncodingCharLength: 100,
  maxExtensionCharLength: 100,
  maxFileWidth: 10000, // px
  maxFileHeight: 10000, // px
  uploadedFileFieldName: 'data',
  routes: {
    getFile: `${endpointConstants.apiv1}/files/getFile`,
    deleteFile: `${endpointConstants.apiv1}/files/deleteFile`,
    getFileDetails: `${endpointConstants.apiv1}/files/getFileDetails`,
    updateFileDetails: `${endpointConstants.apiv1}/files/updateFileDetails`,
    uploadFile: `${endpointConstants.apiv1}/files/uploadFile`,
  },
};
