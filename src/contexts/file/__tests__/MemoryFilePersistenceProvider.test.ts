import assert from 'assert';
import {Readable} from 'stream';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {generateTestFilepathString} from '../../../endpoints/testHelpers/generate/file.js';
import {
  generateAndInsertFileBackendMountListForTest,
  generateFileBackendMountForTest,
} from '../../../endpoints/testHelpers/generate/fileBackend.js';
import {
  generateTestFolderName,
  generateTestFolderpathString,
} from '../../../endpoints/testHelpers/generate/folder.js';
import {expectFileBodyEqual} from '../../../endpoints/testHelpers/helpers/file.js';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../../endpoints/testHelpers/utils.js';
import {loopAndCollate, pathJoin} from '../../../utils/fns.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {MemoryFilePersistenceProvider} from '../MemoryFilePersistenceProvider.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('MemoryFilePersistenceProvider', () => {
  test('toNativePath', () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = generateFileBackendMountForTest({workspaceId});
    const filepath = generateTestFilepathString({length: 4});

    const backend = new MemoryFilePersistenceProvider();
    const {nativePath} = backend.toNativePath({
      mount,
      fimidaraPath: pathJoin(mount.namepath, filepath),
    });

    const expectedNativePath = pathJoin(mount.mountedFrom, filepath);
    expect(nativePath).toBe(expectedNativePath);
  });

  test('toFimidaraPath', () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = generateFileBackendMountForTest({workspaceId});
    const filepath = generateTestFilepathString({length: 4});
    const nativePath = pathJoin(mount.mountedFrom, filepath);

    const backend = new MemoryFilePersistenceProvider();
    const {fimidaraPath} = backend.toFimidaraPath({mount, nativePath});

    const expectedFimidaraPath = pathJoin(mount.namepath, filepath);
    expect(fimidaraPath).toBe(expectedFimidaraPath);
  });

  test('uploadFile', async () => {
    const buffer = Buffer.from('Hello world!');
    const data = Readable.from(buffer);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId,
    });
    const filepath = generateTestFilepathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });

    const backend = new MemoryFilePersistenceProvider();
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    await backend.uploadFile({
      mount,
      workspaceId,
      filepath,
      fileId,
      body: data,
    });

    const savedFile = await backend.readFile({
      filepath,
      mount,
      workspaceId,
      fileId,
    });
    assert(savedFile.body);
    await expectFileBodyEqual(buffer, savedFile.body);
  });

  test('startMultipartUpload', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId,
    });
    const filepath = generateTestFilepathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const fileId = getNewIdForResource(kFimidaraResourceType.File);

    const backend = new MemoryFilePersistenceProvider();
    const {multipartId} = await backend.startMultipartUpload({
      mount,
      workspaceId,
      filepath,
      fileId,
    });

    expect(multipartId).toBeTruthy();
  });

  test('uploadFile, multipart', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId,
    });
    const filepath = generateTestFilepathString({
      parentNamepath: mount.namepath,
      length: mount.namepath.length + 2,
    });
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    const data01 = Buffer.from('Hello world!');
    const stream01 = Readable.from(data01);

    const backend = new MemoryFilePersistenceProvider();
    const {multipartId} = await backend.startMultipartUpload({
      mount,
      workspaceId,
      filepath,
      fileId,
    });
    const result01 = await backend.uploadFile({
      mount,
      workspaceId,
      filepath,
      fileId,
      multipartId,
      body: stream01,
      part: 1,
    });

    expect(result01.multipartId).toBe(multipartId);
    expect(result01.part).toBe(1);
    expect(result01.partId).toBeTruthy();
  });

  test('completeMultipartUpload', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId,
    });
    const filepath = generateTestFilepathString({
      parentNamepath: mount.namepath,
      length: mount.namepath.length + 2,
    });
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    const data01 = Buffer.from('Hello world!');
    const stream01 = Readable.from(data01);
    const data02 = Buffer.from('Hello world!');
    const stream02 = Readable.from(data02);

    const backend = new MemoryFilePersistenceProvider();
    const {multipartId} = await backend.startMultipartUpload({
      mount,
      workspaceId,
      filepath,
      fileId,
    });
    const [result01, result02] = await Promise.all([
      backend.uploadFile({
        mount,
        workspaceId,
        filepath,
        fileId,
        multipartId,
        body: stream01,
        part: 1,
      }),
      backend.uploadFile({
        mount,
        workspaceId,
        filepath,
        fileId,
        multipartId,
        body: stream02,
        part: 2,
      }),
    ]);
    assert(result01.partId);
    assert(result02.partId);
    await backend.completeMultipartUpload({
      mount,
      workspaceId,
      filepath,
      fileId,
      multipartId,
      parts: [
        {
          part: 1,
          partId: result01.partId,
          multipartId,
        },
        {
          part: 2,
          partId: result02.partId,
          multipartId,
        },
      ],
    });

    const savedFile = await backend.readFile({
      filepath,
      fileId,
      mount,
      workspaceId,
    });
    assert(savedFile.body);
    await expectFileBodyEqual(Buffer.concat([data01, data02]), savedFile.body);
  });

  test('cleanupMultipartUpload', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId,
    });
    const filepath = generateTestFilepathString({
      parentNamepath: mount.namepath,
      length: mount.namepath.length + 2,
    });
    const fileId = getNewIdForResource(kFimidaraResourceType.File);

    class TestMemoryFilePersistenceProvider extends MemoryFilePersistenceProvider {
      async hasMultipartUpload(params: {
        multipartId: string;
        workspaceId: string;
      }) {
        const {multipartId} = params;
        const map = this.getWorkspaceFileParts(params);
        return !!map[multipartId]?.length;
      }
    }

    const backend = new TestMemoryFilePersistenceProvider();
    const {multipartId} = await backend.startMultipartUpload({
      mount,
      workspaceId,
      filepath,
      fileId,
    });
    await backend.cleanupMultipartUpload({
      mount,
      workspaceId,
      filepath,
      fileId,
      multipartId,
    });

    expect(
      await backend.hasMultipartUpload({
        multipartId,
        workspaceId,
      })
    ).toBeFalsy();
  });

  test('deleteMultipartUploadPart', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId,
    });
    const filepath = generateTestFilepathString({
      parentNamepath: mount.namepath,
      length: mount.namepath.length + 2,
    });
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    const data01 = Buffer.from('Hello world!');
    const stream01 = Readable.from(data01);
    const data02 = Buffer.from('Hello world!');
    const stream02 = Readable.from(data02);

    class TestMemoryFilePersistenceProvider extends MemoryFilePersistenceProvider {
      async hasMultipartUploadPart(params: {
        multipartId: string;
        workspaceId: string;
        part: number;
      }) {
        const {multipartId, part} = params;
        const map = this.getWorkspaceFileParts(params);
        return !!map[multipartId]?.[part];
      }
    }

    const backend = new TestMemoryFilePersistenceProvider();
    const {multipartId} = await backend.startMultipartUpload({
      mount,
      workspaceId,
      filepath,
      fileId,
    });
    const [result01, result02] = await Promise.all([
      backend.uploadFile({
        mount,
        workspaceId,
        filepath,
        fileId,
        multipartId,
        body: stream01,
        part: 1,
      }),
      backend.uploadFile({
        mount,
        workspaceId,
        filepath,
        fileId,
        multipartId,
        body: stream02,
        part: 2,
      }),
    ]);
    assert(result01.partId);
    assert(result02.partId);

    await backend.deleteMultipartUploadPart({
      mount,
      workspaceId,
      filepath,
      fileId,
      multipartId,
      part: 1,
    });

    expect(
      await backend.hasMultipartUploadPart({
        multipartId,
        workspaceId,
        part: 1,
      })
    ).toBeFalsy();
    expect(
      await backend.hasMultipartUploadPart({
        multipartId,
        workspaceId,
        part: 2,
      })
    ).toBeTruthy();
  });

  test('readFile', async () => {
    const buffer = Buffer.from('Hello world!');
    const data = Readable.from(buffer);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId,
    });
    const filepath = generateTestFilepathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const backend = new MemoryFilePersistenceProvider();
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    await backend.uploadFile({
      mount,
      workspaceId,
      filepath,
      fileId,
      body: data,
    });

    const result = await backend.readFile({
      mount,
      workspaceId,
      filepath,
      fileId,
    });

    assert(result.body);
    await expectFileBodyEqual(buffer, result.body);
  });

  test('deleteFiles', async () => {
    const data = Readable.from(['Hello world!']);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId,
    });
    const filepath01 = generateTestFilepathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const filepath02 = generateTestFilepathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const fileId01 = getNewIdForResource(kFimidaraResourceType.File);
    const fileId02 = getNewIdForResource(kFimidaraResourceType.File);
    const backend = new MemoryFilePersistenceProvider();
    await Promise.all([
      backend.uploadFile({
        mount,
        workspaceId,
        filepath: filepath01,
        fileId: fileId01,
        body: data,
      }),
      backend.uploadFile({
        mount,
        workspaceId,
        filepath: filepath02,
        fileId: fileId02,
        body: data,
      }),
    ]);

    await backend.deleteFiles({
      mount,
      workspaceId,
      files: [
        {filepath: filepath01, fileId: fileId01},
        {filepath: filepath02, fileId: fileId02},
      ],
    });

    const [file01Exists, file02Exists] = await Promise.all([
      backend.readFile({
        mount,
        workspaceId,
        filepath: filepath01,
        fileId: fileId01,
      }),
      backend.readFile({
        mount,
        workspaceId,
        filepath: filepath02,
        fileId: fileId02,
      }),
    ]);
    expect(file01Exists.body).toBeFalsy();
    expect(file02Exists.body).toBeFalsy();
  });

  test('describeFile', async () => {
    const buffer = Buffer.from('Hello world!');
    const data = Readable.from(buffer);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId,
    });
    const filepath = generateTestFilepathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const backend = new MemoryFilePersistenceProvider();
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    await backend.uploadFile({
      mount,
      workspaceId,
      filepath,
      fileId,
      body: data,
    });

    const result = await backend.describeFile({
      mount,
      workspaceId,
      filepath,
      fileId,
    });

    assert(result);
    expect(result.filepath).toBe(filepath);
    expect(result.mountId).toBe(mount.resourceId);
    expect(result.size).toBe(buffer.byteLength);
    expect(result.lastUpdatedAt).toBeTruthy();
  });

  test('describeFolderContent', async () => {
    const buffer = Buffer.from('Hello, world!');
    const data = Readable.from(buffer);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId,
    });
    const folderpath = generateTestFolderpathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const backend = new MemoryFilePersistenceProvider();
    const childrenFilepaths = loopAndCollate(
      () => ({
        filepath: pathJoin(folderpath, generateTestFolderName()),
        fileId: getNewIdForResource(kFimidaraResourceType.File),
      }),
      /** count */ 10
    );
    const childrenDepth02Filepaths = loopAndCollate(
      () => ({
        filepath: pathJoin(folderpath, generateTestFilepathString({length: 2})),
        fileId: getNewIdForResource(kFimidaraResourceType.File),
      }),
      /** count */ 10
    );
    await Promise.all(
      childrenFilepaths
        .map(p =>
          backend.uploadFile({
            mount,
            workspaceId,
            filepath: p.filepath,
            fileId: p.fileId,
            body: data,
          })
        )
        .concat(
          childrenDepth02Filepaths.map(p =>
            backend.uploadFile({
              mount,
              workspaceId,
              filepath: p.filepath,
              fileId: p.fileId,
              body: data,
            })
          )
        )
    );

    let result = await backend.describeFolderContent({
      mount,
      workspaceId,
      folderpath,
      max: 10,
    });

    const resultFilepaths: string[] = [];
    expect(result.files.length).toBe(10);
    expect(result.continuationToken).toBeTruthy();
    result.files.forEach(file => {
      resultFilepaths.push(file.filepath);
      expect(file.mountId).toBe(mount.resourceId);
      expect(file.size).toBe(buffer.byteLength);
      expect(file.lastUpdatedAt).toBeTruthy();
    });

    result = await backend.describeFolderContent({
      mount,
      workspaceId,
      folderpath,
      max: 10,
      continuationToken: result.continuationToken,
    });

    expect(result.files.length).toBe(10);
    expect(result.continuationToken).toBeFalsy();
    result.files.forEach(file => {
      resultFilepaths.push(file.filepath);
      expect(file.mountId).toBe(mount.resourceId);
      expect(file.size).toBe(buffer.byteLength);
      expect(file.lastUpdatedAt).toBeTruthy();
    });

    expect(resultFilepaths).toEqual(
      expect.arrayContaining(
        childrenFilepaths.concat(childrenDepth02Filepaths).map(p => p.filepath)
      )
    );
  });
});
