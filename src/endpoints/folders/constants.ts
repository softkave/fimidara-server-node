import {endpointConstants} from '../constants';

export const folderConstants = {
  minFolderNameLength: 1,
  maxFolderNameLength: 50,
  maxFolderDepth: 10,
  nameSeparator: '/',
  routes: {
    addFolder: `${endpointConstants.apiv1}/folders/addFolder`,
    deleteFolder: `${endpointConstants.apiv1}/folders/deleteFolder`,
    getFolder: `${endpointConstants.apiv1}/folders/getFolder`,
    listFolderContent: `${endpointConstants.apiv1}/folders/listFolderContent`,
    updateFolder: `${endpointConstants.apiv1}/folders/updateFolder`,
  },
};
