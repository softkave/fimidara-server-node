import {uniq} from 'lodash-es';
import {kLoopAsyncSettlementType, loopAndCollateAsync} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../../contexts/ijx/injectables.js';
import {resolveBackendsMountsAndConfigs} from '../../../fileBackends/mountUtils.js';
import {completeTests} from '../../../testUtils/helpers/testFns.js';
import {
  initTests,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../testUtils/testUtils.js';
import {prepareFilepath} from '../../utils/prepareFilepath.js';
import {queueAddInternalMultipartId} from '../queueAddInternalMultipartId.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('queueAddInternalMultipartId', () => {
  test('should add internal multipart id', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {rawFile: file} = await insertFileForTest(userToken, workspace);
    const {primaryMount} = await resolveBackendsMountsAndConfigs(
      /** file */ {
        workspaceId: workspace.resourceId,
        namepath: file.namepath,
      },
      /** initPrimaryBackendOnly */ true
    );

    const filepath = await prepareFilepath({primaryMount, file});
    const {multipartId} = await queueAddInternalMultipartId({
      agent: sessionAgent,
      input: {
        fileId: file.resourceId,
        mount: primaryMount,
        filepath,
        workspaceId: workspace.resourceId,
        namepath: file.namepath,
      },
    });

    expect(multipartId).toBeDefined();

    const dbFile = await kIjxSemantic.file().getOneById(file.resourceId);
    expect(dbFile?.internalMultipartId).toBe(multipartId);
  });

  test('should reuse multipart id', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {rawFile: file} = await insertFileForTest(userToken, workspace);
    const {primaryMount} = await resolveBackendsMountsAndConfigs(
      /** file */ {
        workspaceId: workspace.resourceId,
        namepath: file.namepath,
      },
      /** initPrimaryBackendOnly */ true
    );

    const existingMultipartId = '123';
    await kIjxSemantic.utils().withTxn(async opts => {
      await kIjxSemantic
        .file()
        .updateOneById(
          file.resourceId,
          {internalMultipartId: existingMultipartId},
          opts
        );
    });

    const filepath = await prepareFilepath({primaryMount, file});
    const {multipartId} = await queueAddInternalMultipartId({
      agent: sessionAgent,
      input: {
        fileId: file.resourceId,
        mount: primaryMount,
        filepath,
        workspaceId: workspace.resourceId,
        namepath: file.namepath,
      },
    });

    expect(multipartId).toBe(existingMultipartId);

    const dbFile = await kIjxSemantic.file().getOneById(file.resourceId);
    expect(dbFile?.internalMultipartId).toBe(multipartId);
  });

  test('should add only one multipart id', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {rawFile: file} = await insertFileForTest(userToken, workspace);
    const {primaryMount} = await resolveBackendsMountsAndConfigs(
      /** file */ {
        workspaceId: workspace.resourceId,
        namepath: file.namepath,
      },
      /** initPrimaryBackendOnly */ true
    );

    const filepath = await prepareFilepath({primaryMount, file});

    async function addMultipartId() {
      const {multipartId} = await queueAddInternalMultipartId({
        agent: sessionAgent,
        input: {
          fileId: file.resourceId,
          mount: primaryMount,
          filepath,
          workspaceId: workspace.resourceId,
          namepath: file.namepath,
        },
      });
      return multipartId;
    }

    const multipartIds = await loopAndCollateAsync(
      addMultipartId,
      10,
      kLoopAsyncSettlementType.all
    );

    const uniqueMultipartIds = uniq(multipartIds);
    expect(uniqueMultipartIds.length).toBe(1);

    const dbFile = await kIjxSemantic.file().getOneById(file.resourceId);
    expect(dbFile?.internalMultipartId).toBe(uniqueMultipartIds[0]);
  });
});
