import {kEndpointConstants} from '../constants';

export const kFolderConstants = {
  minFolderNameLength: 1,
  maxFolderNameLength: 50,
  maxFolderDepth: 10,
  separator: '/',
  volumeSeparator: ':',
  routes: {
    addFolder: `${kEndpointConstants.apiv1}/folders/addFolder`,
    deleteFolder: `${kEndpointConstants.apiv1}/folders/deleteFolder`,
    getFolder: `${kEndpointConstants.apiv1}/folders/getFolder`,
    listFolderContent: `${kEndpointConstants.apiv1}/folders/listFolderContent`,
    countFolderContent: `${kEndpointConstants.apiv1}/folders/countFolderContent`,
    updateFolder: `${kEndpointConstants.apiv1}/folders/updateFolder`,
  },
};
