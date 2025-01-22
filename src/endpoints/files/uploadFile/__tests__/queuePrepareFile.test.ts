import {uniq} from 'lodash-es';
import {kLoopAsyncSettlementType, loopAndCollateAsync} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kSemanticModels} from '../../../../contexts/injection/injectables.js';
import {
  generateAndInsertTestFiles,
  generateTestFilepathString,
} from '../../../testUtils/generate/file.js';
import {completeTests} from '../../../testUtils/helpers/testFns.js';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../testUtils/testUtils.js';
import {getFilepathInfo, stringifyFilenamepath} from '../../utils.js';
import {queuePrepareFile} from '../queuePrepareFile.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('queuePrepareFile', () => {
  test('should create file', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(userToken);
    const filepath = generateTestFilepathString({
      rootname: workspace.rootname,
    });

    const file = await queuePrepareFile({
      agent: sessionAgent,
      input: {
        workspace,
        data: {filepath},
      },
    });

    expect(stringifyFilenamepath(file, workspace.rootname)).toEqual(filepath);

    const pathinfo = getFilepathInfo(filepath, {
      containsRootname: true,
      allowRootFolder: false,
    });
    const dbFile = await kSemanticModels.file().getOneByNamepath({
      workspaceId: workspace.resourceId,
      namepath: pathinfo.namepath,
      ext: pathinfo.ext,
    });
    expect(dbFile).toBeDefined();
  });

  test('should return existing file', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(userToken);
    const [file] = await generateAndInsertTestFiles(1, {
      parentId: null,
      workspaceId: workspace.resourceId,
    });

    const filepath = stringifyFilenamepath(file, workspace.rootname);
    const result = await queuePrepareFile({
      agent: sessionAgent,
      input: {workspace, data: {filepath}},
    });

    expect(result.resourceId).toEqual(file.resourceId);
  });

  test('should create file only one file', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(userToken);
    const filepath = generateTestFilepathString({
      rootname: workspace.rootname,
    });

    async function createFile() {
      const file = await queuePrepareFile({
        agent: sessionAgent,
        input: {
          workspace,
          data: {filepath, clientMultipartId: '123', part: 1},
        },
      });
      return file;
    }

    const count = 10;
    const files = await loopAndCollateAsync(
      createFile,
      count,
      kLoopAsyncSettlementType.all
    );

    expect(files.length).toEqual(count);

    const fileIds = files.map(file => {
      return file.resourceId;
    });
    const uniqueFileIds = uniq(fileIds);
    expect(uniqueFileIds.length).toEqual(1);
  });
});
