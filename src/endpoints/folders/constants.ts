import {endpointConstants} from '../constants';

export const kFolderConstants = {
  minFolderNameLength: 1,
  maxFolderNameLength: 50,
  maxFolderDepth: 10,
  separator: '/',
  volumeSeparator: ':',
  routes: {
    addFolder: `${endpointConstants.apiv1}/folders/addFolder`,
    deleteFolder: `${endpointConstants.apiv1}/folders/deleteFolder`,
    getFolder: `${endpointConstants.apiv1}/folders/getFolder`,
    listFolderContent: `${endpointConstants.apiv1}/folders/listFolderContent`,
    countFolderContent: `${endpointConstants.apiv1}/folders/countFolderContent`,
    updateFolder: `${endpointConstants.apiv1}/folders/updateFolder`,
  },
};
