import assert from 'assert';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../../contexts/ijx/injectables.js';
import {generateAndInsertTestFiles} from '../../../testHelpers/generate/file.js';
import {completeTests} from '../../../testHelpers/helpers/testFns.js';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../testHelpers/utils.js';
import {PermissionDeniedError} from '../../../users/errors.js';
import {FileNotWritableError} from '../../errors.js';
import {checkoutFileForUpload} from '../checkoutFileForUpload.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('checkoutFileForUpload', () => {
  test.each([{clientMultipartId: '123'}, {clientMultipartId: undefined}])(
    'should checkout file for upload, clientMultipartId: $clientMultipartId',
    async ({clientMultipartId}) => {
      const {userToken, sessionAgent} = await insertUserForTest();
      const {rawWorkspace: workspace} = await insertWorkspaceForTest(userToken);
      const [file] = await generateAndInsertTestFiles(1, {
        parentId: null,
        workspaceId: workspace.resourceId,
      });

      const checkedFile = await kIjxSemantic.utils().withTxn(async opts => {
        return await checkoutFileForUpload({
          agent: sessionAgent,
          workspace,
          file,
          data: {clientMultipartId},
          opts,
        });
      });

      assert(checkedFile);
      expect(checkedFile.isWriteAvailable).toEqual(false);
      expect(file.resourceId).toEqual(checkedFile.resourceId);

      const dbFile = await kIjxSemantic.file().getOneById(file.resourceId);
      assert(dbFile);
      expect(dbFile.clientMultipartId).toEqual(clientMultipartId);
      expect(dbFile.isWriteAvailable).toEqual(false);
    }
  );

  test('should fail if file is not writeable', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(userToken);
    const [file] = await generateAndInsertTestFiles(1, {
      parentId: null,
      workspaceId: workspace.resourceId,
      isWriteAvailable: false,
    });

    await expect(async () => {
      await kIjxSemantic.utils().withTxn(async opts => {
        const result = await checkoutFileForUpload({
          agent: sessionAgent,
          workspace,
          file,
          data: {},
          opts,
        });
        return result;
      });
    }).rejects.toThrow(FileNotWritableError);
  });

  test('should succeed if file is not writeable but has a multipart upload', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(userToken);
    const clientMultipartId = '123';
    const [file] = await generateAndInsertTestFiles(1, {
      parentId: null,
      workspaceId: workspace.resourceId,
      isWriteAvailable: false,
      clientMultipartId,
    });

    const checkedFile = await kIjxSemantic.utils().withTxn(async opts => {
      return await checkoutFileForUpload({
        agent: sessionAgent,
        workspace,
        file,
        data: {clientMultipartId},
        opts,
      });
    });

    assert(checkedFile);
    expect(checkedFile.clientMultipartId).toEqual(clientMultipartId);
    expect(checkedFile.isWriteAvailable).toEqual(false);
    expect(file.resourceId).toEqual(checkedFile.resourceId);
  });

  test('should succeed if file is not writeable but multipart timeout is expired', async () => {
    const {userToken, sessionAgent} = await insertUserForTest();
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(userToken);
    const oldClientMultipartId = '123';
    const newClientMultipartId = '456';
    const [file] = await generateAndInsertTestFiles(1, {
      parentId: null,
      workspaceId: workspace.resourceId,
      isWriteAvailable: false,
      clientMultipartId: oldClientMultipartId,
      internalMultipartId: '123',
      multipartTimeout: Date.now() - 1000,
    });

    const checkedFile = await kIjxSemantic.utils().withTxn(async opts => {
      return await checkoutFileForUpload({
        agent: sessionAgent,
        workspace,
        file,
        data: {clientMultipartId: newClientMultipartId},
        opts,
      });
    });

    assert(checkedFile);
    expect(checkedFile.clientMultipartId).toEqual(newClientMultipartId);
    expect(checkedFile.isWriteAvailable).toEqual(false);
    expect(file.resourceId).toEqual(checkedFile.resourceId);
  });

  test('should fail if user does not have permission to write to file', async () => {
    const {userToken} = await insertUserForTest();
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(userToken);
    const {sessionAgent: otherUserSessionAgent} = await insertUserForTest();
    const [file] = await generateAndInsertTestFiles(1, {
      parentId: null,
      workspaceId: workspace.resourceId,
    });

    await expect(async () => {
      await kIjxSemantic.utils().withTxn(async opts => {
        return await checkoutFileForUpload({
          agent: otherUserSessionAgent,
          workspace,
          file,
          data: {},
          opts,
        });
      });
    }).rejects.toThrow(PermissionDeniedError);
  });

  test('should succeed if auth is skipped', async () => {
    const {userToken} = await insertUserForTest();
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(userToken);
    const {sessionAgent: otherUserSessionAgent} = await insertUserForTest();
    const [file] = await generateAndInsertTestFiles(1, {
      parentId: null,
      workspaceId: workspace.resourceId,
    });

    const checkedFile = await kIjxSemantic.utils().withTxn(async opts => {
      return await checkoutFileForUpload({
        agent: otherUserSessionAgent,
        workspace,
        file,
        data: {},
        opts,
        skipAuth: true,
      });
    });

    assert(checkedFile);
    expect(checkedFile.isWriteAvailable).toEqual(false);
    expect(file.resourceId).toEqual(checkedFile.resourceId);
  });
});
