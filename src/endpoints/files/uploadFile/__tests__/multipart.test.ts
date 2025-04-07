import assert from 'assert';
import {isNil, last, uniq} from 'lodash-es';
import {waitTimeout} from 'softkave-js-utils';
import {Readable} from 'stream';
import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest';
import {MemoryFilePersistenceProvider} from '../../../../contexts/file/MemoryFilePersistenceProvider.js';
import {
  FilePersistenceProvider,
  FileProviderResolver,
} from '../../../../contexts/file/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../../contexts/ijx/register.js';
import {FimidaraSuppliedConfig} from '../../../../resources/config.js';
import RequestData from '../../../RequestData.js';
import {addRootnameToPath} from '../../../folders/utils.js';
import {generateTestFileName} from '../../../testHelpers/generate/file.js';
import {expectErrorThrown} from '../../../testHelpers/helpers/error.js';
import {completeTests} from '../../../testHelpers/helpers/testFns.js';
import {
  initTests,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../../testHelpers/utils.js';
import startMultipartUpload from '../../startMultipartUpload/handler.js';
import {StartMultipartUploadEndpointParams} from '../../startMultipartUpload/types.js';
import {stringifyFilenamepath} from '../../utils.js';
import {getNextMultipartTimeout} from '../../utils/getNextMultipartTimeout.js';
import {
  multipartFileUpload,
  singleFileUpload,
} from '../testutils/testUploadFns.js';

let defaultFileProviderResolver: FileProviderResolver | undefined;
let defaultSuppliedConfig: FimidaraSuppliedConfig | undefined;

beforeAll(async () => {
  await initTests();
  defaultFileProviderResolver = kIjxUtils.fileProviderResolver();
  defaultSuppliedConfig = kIjxUtils.suppliedConfig();
});

afterEach(() => {
  assert(defaultFileProviderResolver);
  kRegisterIjxUtils.fileProviderResolver(defaultFileProviderResolver);
  if (defaultSuppliedConfig) {
    kRegisterIjxUtils.suppliedConfig(defaultSuppliedConfig);
  }
});

afterAll(async () => {
  await completeTests();
});

describe('multipart.uploadFile', () => {
  test('timeout extended', async () => {
    const {userToken} = await insertUserForTest();
    const {rawWorkspace} = await insertWorkspaceForTest(userToken);
    const {runNext, startUpload} = await multipartFileUpload({
      userToken,
      workspace: rawWorkspace,
    });

    await startUpload();
    let lowerTimeout = getNextMultipartTimeout();
    const {rawFile: rf01} = (await runNext()) ?? {};
    expect(rf01?.multipartTimeout).toBeGreaterThan(lowerTimeout);

    lowerTimeout = getNextMultipartTimeout();
    const {rawFile: rf02} = (await runNext()) ?? {};
    expect(rf02?.multipartTimeout).toBeGreaterThan(lowerTimeout);
  });

  test('file still locked on error', async () => {
    const {userToken} = await insertUserForTest();
    const {rawWorkspace} = await insertWorkspaceForTest(userToken);
    const {runNext, startUpload} = await multipartFileUpload({
      userToken,
      workspace: rawWorkspace,
    });

    // kick off upload
    await startUpload();
    const {rawFile: rf01} = (await runNext()) ?? {};

    class TestFileProvider
      extends MemoryFilePersistenceProvider
      implements FilePersistenceProvider
    {
      uploadFile = async () => {
        throw new Error();
      };
    }

    kRegisterIjxUtils.fileProviderResolver(() => {
      return new TestFileProvider();
    });

    await expectErrorThrown(async () => {
      await runNext();
    });

    assert.ok(rf01);
    const dbFile = await kIjxSemantic.file().getOneById(rf01.resourceId);
    expect(dbFile?.isWriteAvailable).toBeFalsy();
  });

  test('file cleaned on success', async () => {
    const {userToken} = await insertUserForTest();
    const {rawWorkspace} = await insertWorkspaceForTest(userToken);
    const {runAll, startUpload, completeUpload} = await multipartFileUpload({
      userToken,
      workspace: rawWorkspace,
    });

    await startUpload();
    const results = await runAll();
    await completeUpload();
    const rf01 = last(results)?.rawFile;

    assert.ok(rf01);
    const dbFile = await kIjxSemantic.file().getOneById(rf01.resourceId);
    expect(dbFile?.isWriteAvailable).toBeTruthy();
    expect(dbFile?.isReadAvailable).toBeTruthy();
    expect(dbFile?.multipartTimeout).toBeNull();
    expect(dbFile?.internalMultipartId).toBeNull();
    expect(dbFile?.clientMultipartId).toBeNull();
  });

  test('overwrite part', async () => {
    const {userToken} = await insertUserForTest();
    const {rawWorkspace} = await insertWorkspaceForTest(userToken);
    const filepath = addRootnameToPath(
      generateTestFileName(),
      rawWorkspace.rootname
    );

    const clientMultipartId = '1';
    const startReq =
      RequestData.fromExpressRequest<StartMultipartUploadEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {filepath, clientMultipartId}
      );

    const startResult = await startMultipartUpload(startReq);

    const buf01 = Buffer.from('01');
    const {rawFile: rf01} = await insertFileForTest(userToken, rawWorkspace, {
      part: 1,
      data: Readable.from(buf01),
      size: buf01.byteLength,
      clientMultipartId,
      fileId: startResult.file.resourceId,
    });

    assert.ok(rf01);
    assert.ok(rf01.internalMultipartId);
    const [partMeta] = await kIjxSemantic
      .filePart()
      .getManyByMultipartIdAndPart({
        multipartId: rf01.internalMultipartId,
        part: 1,
      });

    assert.ok(partMeta);
    expect(partMeta.size).toBe(buf01.byteLength);
    expect(partMeta.multipartId).toBe(rf01.internalMultipartId);

    const buf02 = Buffer.from('02 03 04 05');
    const {rawFile: rf02} = await insertFileForTest(userToken, rawWorkspace, {
      part: 1,
      data: Readable.from(buf02),
      size: buf02.byteLength,
      clientMultipartId: '1',
      fileId: rf01.resourceId,
    });

    assert.ok(rf02);
    assert.ok(rf02.internalMultipartId);
    const [partMeta2] = await kIjxSemantic
      .filePart()
      .getManyByMultipartIdAndPart({
        multipartId: rf02.internalMultipartId,
        part: 1,
      });

    assert.ok(partMeta2);
    expect(rf01.internalMultipartId).toBe(rf02.internalMultipartId);
    expect(partMeta2.size).toBe(buf02.byteLength);
    expect(partMeta2.part).toBe(partMeta.part);
    expect(partMeta2.multipartId).toBe(rf02.internalMultipartId);
    expect(partMeta2.multipartId).toBe(partMeta.multipartId);
  });

  test('parts cleaned and file unlocked on timeout', async () => {
    const timeoutSecs = 1;
    kRegisterIjxUtils.suppliedConfig({
      ...kIjxUtils.suppliedConfig(),
      multipartLockTimeoutSeconds: timeoutSecs,
    });

    const {userToken} = await insertUserForTest();
    const {rawWorkspace} = await insertWorkspaceForTest(userToken);
    const {runNext, startUpload} = await multipartFileUpload({
      userToken,
      workspace: rawWorkspace,
    });

    await startUpload();
    const {rawFile: rf01} = (await runNext()) ?? {};
    assert.ok(rf01);

    await waitTimeout(timeoutSecs * 1000 + 10);
    const {runNext: runNextSingle} = await singleFileUpload({
      userToken,
      workspace: rawWorkspace,
      fileInput: {filepath: stringifyFilenamepath(rf01, rawWorkspace.rootname)},
    });

    // run should not fail
    const {rawFile: rf02} = (await runNextSingle()) ?? {};
    assert.ok(rf02);

    const dbFile = await kIjxSemantic.file().getOneById(rf01.resourceId);
    expect(dbFile?.isWriteAvailable).toBeTruthy();
    expect(dbFile?.isReadAvailable).toBeTruthy();
    expect(dbFile?.multipartTimeout).toBeNull();
    expect(dbFile?.internalMultipartId).toBeNull();
    expect(dbFile?.clientMultipartId).toBeNull();
  });

  test('single internal multipart ID created', async () => {
    const {userToken} = await insertUserForTest();
    const {rawWorkspace} = await insertWorkspaceForTest(userToken);
    const {runNext, startUpload} = await multipartFileUpload({
      userToken,
      workspace: rawWorkspace,
      partLength: 3,
    });

    await startUpload();
    const results01 = await Promise.allSettled([
      runNext({part: 0, forceRun: true}),
      runNext({part: 0, forceRun: true}),
      runNext({part: 0, forceRun: true}),
      runNext({part: 2, forceRun: true}),
      runNext({part: 1, forceRun: true}),
      runNext({part: 2, forceRun: true}),
      runNext({part: 2, forceRun: true}),
      runNext({part: 1, forceRun: true}),
      runNext({part: 1, forceRun: true}),
    ]);

    // run again
    const results02 = await Promise.allSettled([
      runNext({part: 1, forceRun: true}),
      runNext({part: 0, forceRun: true}),
      runNext({part: 0, forceRun: true}),
      runNext({part: 2, forceRun: true}),
      runNext({part: 2, forceRun: true}),
      runNext({part: 1, forceRun: true}),
      runNext({part: 0, forceRun: true}),
      runNext({part: 0, forceRun: true}),
      runNext({part: 2, forceRun: true}),
      runNext({part: 2, forceRun: true}),
    ]);

    const results = results01.concat(results02);
    const successResults = results.filter(
      (
        r
      ): r is PromiseFulfilledResult<
        NonNullable<Awaited<ReturnType<typeof runNext>>>
      > => r.status === 'fulfilled' && !isNil(r.value)
    );

    assert.ok(successResults.length);
    const rfList = successResults.map(r => r.value.rawFile);
    const multipartIds = rfList.map(rf => rf.internalMultipartId);
    expect(uniq(multipartIds).length).toBe(1);
  });
});
