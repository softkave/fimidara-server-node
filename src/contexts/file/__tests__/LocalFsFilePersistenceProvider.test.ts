import assert from 'assert';
import fse from 'fs-extra';
import path from 'path';
import {sortStringListLexicographically} from 'softkave-js-utils';
import {Readable} from 'stream';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {
  generateTestFileName,
  generateTestFilepathString,
} from '../../../endpoints/testUtils/generate/file.js';
import {
  generateAndInsertFileBackendMountListForTest,
  generateFileBackendMountForTest,
} from '../../../endpoints/testUtils/generate/fileBackend.js';
import {
  generateTestFolderName,
  generateTestFolderpathString,
} from '../../../endpoints/testUtils/generate/folder.js';
import {expectFileBodyEqual} from '../../../endpoints/testUtils/helpers/file.js';
import {completeTests} from '../../../endpoints/testUtils/helpers/testFns.js';
import {initTests} from '../../../endpoints/testUtils/testUtils.js';
import {loopAndCollate, pathJoin, pathSplit} from '../../../utils/fns.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {kUtilsInjectables} from '../../injection/injectables.js';
import {LocalFsFilePersistenceProvider} from '../LocalFsFilePersistenceProvider.js';

// TODO: there're times FS tests fail not because of code bugs but data issues,
// so we need to fix that

const testDirName = `${Date.now()}`;
let testDir: string | undefined;

beforeAll(async () => {
  await initTests();
  const testLocalFsDir = kUtilsInjectables.suppliedConfig().localFsDir;
  assert(testLocalFsDir);
  testDir = path.normalize(path.resolve(testLocalFsDir) + '/' + testDirName);
  await fse.ensureDir(testDir);
});

afterAll(async () => {
  await completeTests();
  assert(testDir);
  await fse.remove(testDir);
});

describe('LocalFsFilePersistenceProvider', () => {
  test('toNativePath', () => {
    assert(testDir);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = generateFileBackendMountForTest({workspaceId});
    const filepath = generateTestFilepathString({length: 4});

    const backend = new LocalFsFilePersistenceProvider({dir: testDir});
    const {nativePath} = backend.toNativePath({
      mount,
      fimidaraPath: pathJoin(mount.namepath, filepath),
    });

    const expectedNativePath = pathJoin(testDir, mount.mountedFrom, filepath);
    const p1 = pathSplit(nativePath);
    const p2 = pathSplit(expectedNativePath);
    expect(p1).toEqual(expect.arrayContaining(p2));
  });

  test('toFimidaraPath', () => {
    assert(testDir);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = generateFileBackendMountForTest({workspaceId});
    const filepath = generateTestFilepathString({length: 4});
    const nativePath = pathJoin(testDir, mount.mountedFrom, filepath);

    const backend = new LocalFsFilePersistenceProvider({dir: testDir});
    const {fimidaraPath} = backend.toFimidaraPath({mount, nativePath});

    const expectedFimidaraPath = pathJoin(mount.namepath, filepath);
    expect(fimidaraPath).toBe(expectedFimidaraPath);
  });

  test('uploadFile', async () => {
    assert(testDir);
    const filepath = generateTestFilepathString({length: 3});
    const data = Readable.from(['Hello world!']);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId,
    });

    const backend = new LocalFsFilePersistenceProvider({dir: testDir});
    await backend.uploadFile({
      mount,
      workspaceId,
      filepath,
      body: data,
      fileId: getNewIdForResource(kFimidaraResourceType.File),
    });

    const {nativePath} = backend.toNativePath({mount, fimidaraPath: filepath});
    const savedBuffer = await fse.readFile(nativePath);
    expectFileBodyEqual(data, savedBuffer);
  });

  test('readFile', async () => {
    assert(testDir);
    const buffer = Buffer.from('Hello world!');
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId,
    });
    const filepath = generateTestFilepathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const backend = new LocalFsFilePersistenceProvider({dir: testDir});
    const {nativePath} = backend.toNativePath({mount, fimidaraPath: filepath});
    await fse.outputFile(nativePath, buffer);

    const result = await backend.readFile({
      mount,
      workspaceId,
      filepath,
      fileId: getNewIdForResource(kFimidaraResourceType.File),
    });

    assert(result.body);
    expectFileBodyEqual(buffer, result.body);
  });

  test('deleteFiles', async () => {
    assert(testDir);
    const buffer = Buffer.from('Hello, world!');
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
    const backend = new LocalFsFilePersistenceProvider({dir: testDir});
    const {nativePath: nativePath01} = backend.toNativePath({
      mount,
      fimidaraPath: filepath01,
    });
    const {nativePath: nativePath02} = backend.toNativePath({
      mount,
      fimidaraPath: filepath02,
    });
    await Promise.all([
      fse.outputFile(nativePath01, buffer),
      fse.outputFile(nativePath02, buffer),
    ]);

    await backend.deleteFiles({
      mount,
      workspaceId,
      files: [
        {
          filepath: filepath01,
          fileId: getNewIdForResource(kFimidaraResourceType.File),
        },
        {
          filepath: filepath02,
          fileId: getNewIdForResource(kFimidaraResourceType.File),
        },
      ],
    });

    const [file01Exists, file02Exists] = await Promise.all([
      fse.pathExists(filepath01),
      fse.pathExists(filepath02),
    ]);
    expect(file01Exists).toBeFalsy();
    expect(file02Exists).toBeFalsy();
  });

  test('deleteFolders', async () => {
    assert(testDir);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId,
    });
    const folderpath01 = generateTestFolderpathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const folderpath02 = generateTestFolderpathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const backend = new LocalFsFilePersistenceProvider({dir: testDir});
    const {nativePath: nativePath01} = backend.toNativePath({
      mount,
      fimidaraPath: folderpath01,
    });
    const {nativePath: nativePath02} = backend.toNativePath({
      mount,
      fimidaraPath: folderpath02,
    });
    await Promise.all([
      fse.ensureDir(nativePath01),
      fse.ensureDir(nativePath02),
    ]);
    await Promise.all([
      fse.ensureDir(nativePath01 + '/' + generateTestFolderName()),
      fse.outputFile(
        nativePath02 + '/' + generateTestFileName(),
        'Hello, world!'
      ),
    ]);

    await backend.deleteFolders({
      mount,
      workspaceId,
      folders: [{folderpath: folderpath01}, {folderpath: folderpath02}],
    });

    const [folder01Exists, folder02Exists] = await Promise.all([
      fse.pathExists(folderpath01),
      fse.pathExists(folderpath02),
    ]);
    expect(folder01Exists).toBeFalsy();
    expect(folder02Exists).toBeFalsy();
  });

  test('describeFile', async () => {
    assert(testDir);
    const buffer = Buffer.from('Hello world!');
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId,
    });
    const filepath = generateTestFilepathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const backend = new LocalFsFilePersistenceProvider({dir: testDir});
    const {nativePath} = backend.toNativePath({mount, fimidaraPath: filepath});
    await fse.ensureFile(nativePath);
    await fse.outputFile(nativePath, buffer);

    const result = await backend.describeFile({
      mount,
      workspaceId,
      filepath,
      fileId: getNewIdForResource(kFimidaraResourceType.File),
    });

    assert(result);
    expect(result.filepath).toBe(filepath);
    expect(result.mountId).toBe(mount.resourceId);
    expect(result.size).toBe(buffer.byteLength);
    expect(result.lastUpdatedAt).toBeTruthy();
  });

  test('describeFolder', async () => {
    assert(testDir);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId,
    });
    const folderpath = generateTestFolderpathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const backend = new LocalFsFilePersistenceProvider({dir: testDir});
    const {nativePath: nativePath01} = backend.toNativePath({
      mount,
      fimidaraPath: folderpath,
    });
    await Promise.all([fse.ensureDir(nativePath01)]);

    const result = await backend.describeFolder({
      mount,
      workspaceId,
      folderpath,
    });

    assert(result);
    expect(result.folderpath).toBe(folderpath);
    expect(result.mountId).toBe(mount.resourceId);
  });

  test('describeFolderContent', async () => {
    assert(testDir);
    const buffer = Buffer.from('Hello, world!');
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const [mount] = await generateAndInsertFileBackendMountListForTest(1, {
      workspaceId,
    });
    const folderpath = generateTestFolderpathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const backend = new LocalFsFilePersistenceProvider({dir: testDir});
    const {nativePath} = backend.toNativePath({
      mount,
      fimidaraPath: folderpath,
    });
    const childrenNativePaths = loopAndCollate(
      () => pathJoin(nativePath, generateTestFolderName()),
      /** count */ 5
    );
    const childrenDepth02NativePaths = loopAndCollate(
      () => pathJoin(nativePath, generateTestFilepathString({length: 2})),
      /** count */ 5
    );
    const childrenFilepaths = childrenNativePaths.map(
      p => backend.toFimidaraPath({mount, nativePath: p}).fimidaraPath
    );
    const childrenDepth02Filepaths = childrenDepth02NativePaths.map(
      p => backend.toFimidaraPath({mount, nativePath: p}).fimidaraPath
    );
    const childrenFolderpaths = childrenDepth02Filepaths.map(p =>
      pathJoin(pathSplit(p).slice(0, -1))
    );
    await Promise.all([fse.ensureDir(nativePath)]);
    await Promise.all(
      childrenNativePaths
        .map(p => fse.outputFile(p, buffer))
        .concat(childrenDepth02NativePaths.map(p => fse.outputFile(p, buffer)))
    );

    let result = await backend.describeFolderContent({
      mount,
      workspaceId,
      folderpath,
      max: 5,
    });

    const resultFilepaths: string[] = [];
    const resultFolderpaths: string[] = [];
    expect(result.files.length + result.folders.length).toBe(5);
    expect(result.continuationToken).toBeTruthy();
    result.files.forEach(file => {
      resultFilepaths.push(file.filepath);
      expect(file.mountId).toBe(mount.resourceId);
      expect(file.size).toBe(buffer.byteLength);
      expect(file.lastUpdatedAt).toBeTruthy();
    });
    result.folders.forEach(folder => {
      resultFolderpaths.push(folder.folderpath);
      expect(folder.mountId).toBe(mount.resourceId);
    });

    result = await backend.describeFolderContent({
      mount,
      workspaceId,
      folderpath,
      max: 5,
      continuationToken: result.continuationToken,
    });

    expect(result.files.length + result.folders.length).toBe(5);
    result.files.forEach(file => {
      resultFilepaths.push(file.filepath);
      expect(file.mountId).toBe(mount.resourceId);
      expect(file.size).toBe(buffer.byteLength);
      expect(file.lastUpdatedAt).toBeTruthy();
    });
    result.folders.forEach(folder => {
      resultFolderpaths.push(folder.folderpath);
      expect(folder.mountId).toBe(mount.resourceId);
    });

    expect(sortStringListLexicographically(resultFilepaths)).toEqual(
      sortStringListLexicographically(childrenFilepaths)
    );
    expect(sortStringListLexicographically(resultFolderpaths)).toEqual(
      sortStringListLexicographically(childrenFolderpaths)
    );
    expect(resultFilepaths).not.toEqual(childrenDepth02Filepaths);
  });
});
