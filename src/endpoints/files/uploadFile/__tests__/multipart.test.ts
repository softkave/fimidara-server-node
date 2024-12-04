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
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../../contexts/injection/injectables.js';
import {kRegisterUtilsInjectables} from '../../../../contexts/injection/register.js';
import {FimidaraSuppliedConfig} from '../../../../resources/config.js';
import {expectErrorThrown} from '../../../testUtils/helpers/error.js';
import {completeTests} from '../../../testUtils/helpers/testFns.js';
import {
  initTests,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../../testUtils/testUtils.js';
import {stringifyFilenamepath} from '../../utils.js';
import {getNextMultipartTimeout} from '../../utils/getNextMultipartTimeout.js';
import {getMultipartUploadPartMeta} from '../../utils/multipartUploadMeta.js';
import {
  multipartFileUpload,
  singleFileUpload,
} from '../testutils/testUploadFns.js';

let defaultFileProviderResolver: FileProviderResolver | undefined;
let defaultSuppliedConfig: FimidaraSuppliedConfig | undefined;

beforeAll(async () => {
  await initTests();
  defaultFileProviderResolver = kUtilsInjectables.fileProviderResolver();
  defaultSuppliedConfig = kUtilsInjectables.suppliedConfig();
});

afterEach(() => {
  assert(defaultFileProviderResolver);
  kRegisterUtilsInjectables.fileProviderResolver(defaultFileProviderResolver);
  if (defaultSuppliedConfig) {
    kRegisterUtilsInjectables.suppliedConfig(defaultSuppliedConfig);
  }
});

afterAll(async () => {
  await completeTests();
});

describe('multipart.uploadFile', () => {
  test('timeout extended', async () => {
    const {userToken} = await insertUserForTest();
    const {rawWorkspace} = await insertWorkspaceForTest(userToken);
    const {runNext} = await multipartFileUpload({
      userToken,
      workspace: rawWorkspace,
    });

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
    const {runNext} = await multipartFileUpload({
      userToken,
      workspace: rawWorkspace,
    });

    // kick off upload
    const {rawFile: rf01} = (await runNext()) ?? {};

    class TestFileProvider
      extends MemoryFilePersistenceProvider
      implements FilePersistenceProvider
    {
      uploadFile = async () => {
        throw new Error();
      };
    }

    kRegisterUtilsInjectables.fileProviderResolver(() => {
      return new TestFileProvider();
    });

    await expectErrorThrown(async () => {
      await runNext();
    });

    assert.ok(rf01);
    const dbFile = await kSemanticModels.file().getOneById(rf01.resourceId);
    expect(dbFile?.isWriteAvailable).toBeFalsy();
  });

  test('file cleaned on success', async () => {
    const {userToken} = await insertUserForTest();
    const {rawWorkspace} = await insertWorkspaceForTest(userToken);
    const {runAll} = await multipartFileUpload({
      userToken,
      workspace: rawWorkspace,
    });

    const results = await runAll();
    const rf01 = last(results)?.rawFile;

    assert.ok(rf01);
    const dbFile = await kSemanticModels.file().getOneById(rf01.resourceId);
    expect(dbFile?.isWriteAvailable).toBeTruthy();
    expect(dbFile?.isReadAvailable).toBeTruthy();
    expect(dbFile?.multipartTimeout).toBeNull();
    expect(dbFile?.internalMultipartId).toBeNull();
    expect(dbFile?.clientMultipartId).toBeNull();
  });

  test('overwrite part', async () => {
    const {userToken} = await insertUserForTest();
    const {rawWorkspace} = await insertWorkspaceForTest(userToken);
    const buf01 = Buffer.from('01');
    const {rawFile: rf01} = await insertFileForTest(userToken, rawWorkspace, {
      part: 0,
      data: Readable.from(buf01),
      size: buf01.byteLength,
      clientMultipartId: '1',
    });

    assert.ok(rf01);
    assert.ok(rf01.internalMultipartId);
    const partMeta = await getMultipartUploadPartMeta({
      multipartId: rf01.internalMultipartId,
      part: 0,
    });
    assert.ok(partMeta);
    expect(partMeta.size).toBe(buf01.byteLength);
    expect(partMeta.multipartId).toBe(rf01.internalMultipartId);

    const buf02 = Buffer.from('02 03 04 05');
    const {rawFile: rf02} = await insertFileForTest(userToken, rawWorkspace, {
      part: 0,
      data: Readable.from(buf02),
      size: buf02.byteLength,
      clientMultipartId: '1',
    });

    assert.ok(rf02);
    assert.ok(rf02.internalMultipartId);
    const partMeta2 = await getMultipartUploadPartMeta({
      multipartId: rf02.internalMultipartId,
      part: 0,
    });
    assert.ok(partMeta2);
    expect(partMeta2.size).toBe(buf02.byteLength);
    expect(partMeta2.part).toBe(partMeta.part);
    expect(partMeta2.multipartId).toBe(partMeta.multipartId);
  });

  test('parts cleaned and file unlocked on timeout', async () => {
    const timeout = 5;
    kRegisterUtilsInjectables.suppliedConfig({
      ...kUtilsInjectables.suppliedConfig(),
      multipartLockTimeoutSeconds: timeout,
    });

    const {userToken} = await insertUserForTest();
    const {rawWorkspace} = await insertWorkspaceForTest(userToken);
    const {runNext} = await multipartFileUpload({
      userToken,
      workspace: rawWorkspace,
    });

    const {rawFile: rf01} = (await runNext()) ?? {};
    assert.ok(rf01);

    await waitTimeout(timeout + 1);
    const {runNext: runNextSingle} = await singleFileUpload({
      userToken,
      workspace: rawWorkspace,
      fileInput: {filepath: stringifyFilenamepath(rf01, rawWorkspace.rootname)},
    });

    // run should not fail
    const {rawFile: rf02} = (await runNextSingle()) ?? {};
    assert.ok(rf02);

    const dbFile = await kSemanticModels.file().getOneById(rf01.resourceId);
    expect(dbFile?.isWriteAvailable).toBeTruthy();
    expect(dbFile?.isReadAvailable).toBeTruthy();
    expect(dbFile?.multipartTimeout).toBeNull();
    expect(dbFile?.internalMultipartId).toBeNull();
    expect(dbFile?.clientMultipartId).toBeNull();
  });

  test('single internal multipart ID created', async () => {
    const {userToken} = await insertUserForTest();
    const {rawWorkspace} = await insertWorkspaceForTest(userToken);
    const {runNext} = await multipartFileUpload({
      userToken,
      workspace: rawWorkspace,
      partLength: 3,
    });

    async function wrapOrCatch(fn: () => Promise<unknown>) {
      try {
        return {status: 'success', result: await fn()};
      } catch (e) {
        return {status: 'error', error: e};
      }
    }

    const results01 = await Promise.all([
      wrapOrCatch(() => runNext({part: 0, forceRun: true})),
      wrapOrCatch(() => runNext({part: 0, forceRun: true})),
      wrapOrCatch(() => runNext({part: 2, forceRun: true})),
      wrapOrCatch(() => runNext({part: 1, forceRun: true})),
      wrapOrCatch(() => runNext({part: 1, forceRun: true})),
    ]);
    // run again
    const results02 = await Promise.all([
      wrapOrCatch(() => runNext({part: 0, forceRun: true})),
      wrapOrCatch(() => runNext({part: 1, forceRun: true})),
    ]);
    const results = results01.concat(results02);
    const successResults = results.filter(
      (
        r
      ): r is {
        status: 'success';
        result: NonNullable<Awaited<ReturnType<typeof runNext>>>;
      } => r.status === 'success' && !isNil(r.result)
    );
    assert.ok(successResults.length);
    const rfList = successResults.map(r => r.result.rawFile);
    const multipartIds = rfList.map(rf => rf.internalMultipartId);
    expect(uniq(multipartIds).length).toBe(1);
  });
});
