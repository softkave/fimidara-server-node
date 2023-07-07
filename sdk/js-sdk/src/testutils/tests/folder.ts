import {FimidaraEndpoints} from '../../publicEndpoints';
import {
  addFolderTestExecFn,
  deleteFolderTestExecFn,
  getFolderTestExecFn,
  listFolderContentTestExecFn,
  setupFolderContentTestExecFn,
  updateFolderTestExecFn,
} from '../execFns/folder';
import {
  ITestVars,
  containsNoneIn,
  getTestVars,
  indexByResourceId,
} from '../utils';

const vars: ITestVars = getTestVars();
const fimidara = new FimidaraEndpoints({authToken: vars.authToken});

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
  expect(result00.body.page).toBe(0);
  expect(result01.body.page).toBe(1);
  containsNoneIn(result00.body.files, result01.body.files, indexByResourceId);
  containsNoneIn(
    result00.body.folders,
    result01.body.folders,
    indexByResourceId
  );
};

export const test_updateFolder = async () => {
  await updateFolderTestExecFn(fimidara, vars);
};
