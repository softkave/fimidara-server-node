import {expect} from 'vitest';
import {FimidaraEndpoints} from '../../endpoints/publicEndpoints.js';
import {
  addFolderTestExecFn,
  deleteFolderTestExecFn,
  getFolderTestExecFn,
  listFolderContentTestExecFn,
  setupFolderContentTestExecFn,
  updateFolderTestExecFn,
} from '../execFns/folder.js';
import {
  ITestVars,
  getTestVars,
  containsNoneIn,
  indexByResourceId,
} from '../utils.common.js';

const vars: ITestVars = getTestVars();
const fimidara = new FimidaraEndpoints({
  authToken: vars.authToken,
  serverURL: vars.serverURL,
});

export const test_addFolder = async () => {
  await addFolderTestExecFn(fimidara, vars);
};

export const test_deleteFolder = async () => {
  await deleteFolderTestExecFn(fimidara, vars);
};

export const test_getFolder = async () => {
  await getFolderTestExecFn(fimidara, vars);
};

export const test_listFolderContent = async () => {
  const count = 15;
  const pageSize = 10;
  const {folderpath} = await setupFolderContentTestExecFn(
    fimidara,
    vars,
    {},
    count
  );
  const [result00, result01] = await Promise.all([
    listFolderContentTestExecFn(fimidara, vars, {
      folderpath,
      pageSize,
      page: 0,
    }),
    listFolderContentTestExecFn(fimidara, vars, {
      folderpath,
      pageSize,
      page: 1,
    }),
  ]);
  expect(result00.page).toBe(0);
  expect(result01.page).toBe(1);
  containsNoneIn(result00.files, result01.files, indexByResourceId);
  containsNoneIn(result00.folders, result01.folders, indexByResourceId);
};

export const test_updateFolder = async () => {
  await updateFolderTestExecFn(fimidara, vars);
};
