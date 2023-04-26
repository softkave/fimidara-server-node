import {FimidaraEndpoints} from '..';
import {
  deleteFileTest,
  getFileDetailsTest,
  readFileTest,
  updateFileDetailsTest,
  uploadFileTest,
} from '../testutils/file';
import {ITestVars, getTestVars} from '../testutils/utils';

const vars: ITestVars = getTestVars();
const fimidara = new FimidaraEndpoints({authToken: vars.authToken});

describe('file', () => {
  test('upload file', async () => {
    await uploadFileTest(fimidara, vars);
  });

  test('read file', async () => {
    await readFileTest(fimidara, vars);
  });

  test('update file details', async () => {
    await updateFileDetailsTest(fimidara, vars);
  });

  test('get file details', async () => {
    await getFileDetailsTest(fimidara, vars);
  });

  test('delete file', async () => {
    await deleteFileTest(fimidara, vars);
  });
});
