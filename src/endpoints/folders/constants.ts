import assert from 'assert';
import {kIjxUtils} from '../../contexts/ijx/injectables.js';
import {kEndpointConstants} from '../constants.js';

export const kFolderConstants = {
  minFolderNameLength: 1,
  maxFolderNameLength: 70,
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
  addFolderQueueTimeout: 30_000,
  addFolderProcessCount: 100,
  getAddFolderPubSubChannel: (folderpath: string) =>
    `${kIjxUtils.suppliedConfig().addFolderPubSubChannelPrefix}-${folderpath}`,
  getAddFolderQueueWithNo: (num: number) =>
    `${kIjxUtils.suppliedConfig().addFolderQueuePrefix}${num}`,
  getAddFolderQueueKey: (folderpath: string) => {
    const {addFolderQueueStart, addFolderQueueEnd} = kIjxUtils.suppliedConfig();

    assert.ok(addFolderQueueStart);
    assert.ok(addFolderQueueEnd);

    const queueCount = addFolderQueueEnd - addFolderQueueStart + 1;
    assert.ok(queueCount > 0);

    // consistently select a queue between 1 and queueCount using the
    // folderpath.split("/")[1] as the seed
    const folderpath1 = folderpath.split('/')[1];
    assert.ok(folderpath1);

    const hash = folderpath1.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    const key = kFolderConstants.getAddFolderQueueWithNo(
      (hash % queueCount) + addFolderQueueStart
    );

    return key;
  },
};
