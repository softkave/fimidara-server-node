import assert from 'assert';
import {Readable} from 'stream';
import {kFimidaraResourceType} from '../../../../definitions/system';
import {loopAndCollate, pathJoin} from '../../../../utils/fns';
import {getNewIdForResource} from '../../../../utils/resource';
import {generateTestFilepathString} from '../../../testUtils/generate/file';
import {
  generateAndInsertFileBackendMountListForTest,
  generateFileBackendMountForTest,
} from '../../../testUtils/generate/fileBackend';
import {
  generateTestFolderName,
  generateTestFolderpathString,
} from '../../../testUtils/generate/folder';
import {expectFileBodyEqual} from '../../../testUtils/helpers/file';
import {completeTests} from '../../../testUtils/helpers/testFns';
import {initTests} from '../../../testUtils/testUtils';
import {MemoryFilePersistenceProvider} from '../MemoryFilePersistenceProvider';

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
    const data = Readable.from(['Hello world!']);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {workspaceId});
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

    const savedFile = await backend.readFile({filepath, mount, workspaceId, fileId});
    assert(savedFile.body);
    expectFileBodyEqual(data, savedFile.body);
  });

  test('readFile', async () => {
    const data = Readable.from(['Hello world!']);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {workspaceId});
    const filepath = generateTestFilepathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const backend = new MemoryFilePersistenceProvider();
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    await backend.uploadFile({mount, workspaceId, filepath, fileId, body: data});

    const result = await backend.readFile({mount, workspaceId, filepath, fileId});

    assert(result.body);
    expectFileBodyEqual(data, result.body);
  });

  test('deleteFiles', async () => {
    const data = Readable.from(['Hello world!']);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {workspaceId});
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
      backend.readFile({mount, workspaceId, filepath: filepath01, fileId: fileId01}),
      backend.readFile({mount, workspaceId, filepath: filepath02, fileId: fileId02}),
    ]);
    expect(file01Exists.body).toBeFalsy();
    expect(file02Exists.body).toBeFalsy();
  });

  test('describeFile', async () => {
    const buffer = Buffer.from('Hello world!');
    const data = Readable.from(buffer);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {workspaceId});
    const filepath = generateTestFilepathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const backend = new MemoryFilePersistenceProvider();
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    await backend.uploadFile({mount, workspaceId, filepath, fileId, body: data});

    const result = await backend.describeFile({mount, workspaceId, filepath, fileId});

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
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {workspaceId});
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
