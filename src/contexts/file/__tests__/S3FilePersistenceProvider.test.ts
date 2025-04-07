import {
  DeleteObjectsCommand,
  ListMultipartUploadsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import assert from 'assert';
import {merge} from 'lodash-es';
import {Readable} from 'stream';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {
  FileBackendMount,
  kFileBackendType,
} from '../../../definitions/fileBackend.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {generateTestFilepathString} from '../../../endpoints/testHelpers/generate/file.js';
import {generateTestTextFile} from '../../../endpoints/testHelpers/generate/file/generateTestTextFile.js';
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
import {loopAndCollate, pathJoin, pathSplit} from '../../../utils/fns.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {kIjxUtils} from '../../ijx/injectables.js';
import {S3FilePersistenceProvider} from '../S3FilePersistenceProvider.js';
import {
  FilePersistenceUploadFileParams,
  FilePersistenceUploadFileResult,
} from '../types.js';

// TODO: delete keys when done

const prefix: string[] = [];
const keysToCleanup: Array<string> = [];

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  const {bucket, awsCreds} = getTestAWSConfig();
  const s3 = new S3Client({
    region: awsCreds.region,
    credentials: {
      secretAccessKey: awsCreds.secretAccessKey,
      accessKeyId: awsCreds.accessKeyId,
    },
  });
  const command = new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: {
      Objects: keysToCleanup.map(key => ({Key: key})),
    },
  });
  await s3.send(command);
  await completeTests();
});

describe.skip('S3FilePersistenceProvider', () => {
  test('toNativePath', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = await getNewMount({workspaceId});
    const filepath = generateTestFilepathString({length: 4});

    const backend = getS3BackendInstance();
    const {nativePath} = backend.toNativePath({
      mount,
      fimidaraPath: pathJoin(mount.namepath, filepath),
    });

    const expectedNativePath = pathJoin(mount.mountedFrom.slice(1), filepath);
    expect(nativePath).toBe(expectedNativePath);
  });

  test('toFimidaraPath', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = await getNewMount({workspaceId});
    const filepath = generateTestFilepathString({length: 4});
    const nativePath = pathJoin(mount.mountedFrom.slice(1), filepath);

    const backend = getS3BackendInstance();
    const {fimidaraPath} = backend.toFimidaraPath({mount, nativePath});

    const expectedFimidaraPath = pathJoin(mount.namepath, filepath);
    expect(fimidaraPath).toBe(expectedFimidaraPath);
  });

  test('uploadFile', async () => {
    const data = Readable.from(['Hello world!']);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = await getNewMount({workspaceId});
    const filepath = generateTestFilepathString({
      parentNamepath: mount.namepath,
      length: mount.namepath.length + 2,
    });
    const fileId = getNewIdForResource(kFimidaraResourceType.File);

    const backend = getS3BackendInstance();
    await backend.uploadFile({
      mount,
      workspaceId,
      filepath,
      fileId,
      body: data,
    });

    const savedFile = await backend.readFile({
      filepath,
      fileId,
      mount,
      workspaceId,
    });
    assert(savedFile.body);
    await expectFileBodyEqual(data, savedFile.body);
  });

  test('startMultipartUpload', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = await getNewMount({workspaceId});
    const filepath = generateTestFilepathString({
      parentNamepath: mount.namepath,
      length: mount.namepath.length + 2,
    });
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    const backend = getS3BackendInstance();
    const result = await backend.startMultipartUpload({
      mount,
      workspaceId,
      filepath,
      fileId,
    });

    expect(result.multipartId).toBeTruthy();
  });

  test('uploadFile, multipart', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = await getNewMount({workspaceId});
    const filepath = generateTestFilepathString({
      parentNamepath: mount.namepath,
      length: mount.namepath.length + 2,
    });
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    const data01 = Buffer.from('Hello world!');
    const stream01 = Readable.from(data01);

    const backend = getS3BackendInstance();
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
    const mount = await getNewMount({workspaceId});
    const filepath = generateTestFilepathString({
      parentNamepath: mount.namepath,
      length: mount.namepath.length + 2,
    });
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    const {dataBuffer: data01, getStream: getStream01} = generateTestTextFile({
      minSize: 5 * 1024 * 1024, // 5 MB
    });
    const {dataBuffer: data02, getStream: getStream02} = generateTestTextFile({
      minSize: 5 * 1024 * 1024, // 5 MB
    });
    const stream01 = getStream01();
    const stream02 = getStream02();

    const backend = getS3BackendInstance();
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
          multipartId,
          part: 1,
          partId: result01.partId,
        },
        {
          multipartId,
          part: 2,
          partId: result02.partId,
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
    const mount = await getNewMount({workspaceId});
    const filepath = generateTestFilepathString({
      parentNamepath: mount.namepath,
      length: mount.namepath.length + 2,
    });
    const fileId = getNewIdForResource(kFimidaraResourceType.File);

    const backend = getS3BackendInstance();
    const {multipartId} = await backend.startMultipartUpload({
      mount,
      workspaceId,
      filepath,
      fileId,
    });
    let result = await backend.listFileMultipartUploads({
      mount,
      filepath,
    });
    expect(result.Uploads?.length).toBeTruthy();

    await backend.cleanupMultipartUpload({
      mount,
      workspaceId,
      filepath,
      fileId,
      multipartId,
    });

    result = await backend.listFileMultipartUploads({
      mount,
      filepath,
    });
    expect(result.Uploads?.length).toBeFalsy();
  });

  test('readFile', async () => {
    const data = Readable.from(['Hello world!']);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = await getNewMount({workspaceId});
    const filepath = generateTestFilepathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    const backend = getS3BackendInstance();
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
    await expectFileBodyEqual(data, result.body);
  });

  test('deleteFiles', async () => {
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = await getNewMount({workspaceId});
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
    const backend = getS3BackendInstance();
    await Promise.all([
      backend.uploadFile({
        mount,
        workspaceId,
        filepath: filepath01,
        fileId: fileId01,
        body: Readable.from(['Hello world!']),
      }),
      backend.uploadFile({
        mount,
        workspaceId,
        filepath: filepath02,
        fileId: fileId02,
        body: Readable.from(['Hello world!']),
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

    await Promise.all([
      expectFileNotFound({
        backend,
        mount,
        workspaceId,
        filepath: filepath01,
        fileId: fileId01,
      }),
      expectFileNotFound({
        backend,
        mount,
        workspaceId,
        filepath: filepath02,
        fileId: fileId02,
      }),
    ]);
  });

  test('describeFile', async () => {
    const buffer = Buffer.from('Hello world!');
    const data = Readable.from(buffer);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = await getNewMount({workspaceId});
    const filepath = generateTestFilepathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    const backend = getS3BackendInstance();
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

  test('describeFolder', async () => {
    const buffer = Buffer.from('Hello world!');
    const data = Readable.from(buffer);
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = await getNewMount({workspaceId});
    const filepath = generateTestFilepathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const fileId = getNewIdForResource(kFimidaraResourceType.File);
    const backend = getS3BackendInstance();
    await backend.uploadFile({
      mount,
      workspaceId,
      filepath,
      fileId,
      body: data,
    });

    const splitFilepath = pathSplit(filepath);
    const folderpath = pathJoin(splitFilepath.slice(0, -1));
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
    const buffer = Buffer.from('Hello, world!');
    const workspaceId = getNewIdForResource(kFimidaraResourceType.Workspace);
    const mount = await getNewMount({workspaceId});
    const folderpath = generateTestFolderpathString({
      length: mount.namepath.length + 2,
      parentNamepath: mount.namepath,
    });
    const backend = getS3BackendInstance();
    const childrenFilepaths = loopAndCollate(
      () => ({
        filepath: pathJoin(folderpath, generateTestFolderName()),
        fileId: getNewIdForResource(kFimidaraResourceType.File),
      }),
      /** count */ 5
    );
    const childrenFolderpaths = loopAndCollate(
      () => pathJoin(folderpath, generateTestFolderName()),
      /** count */ 5
    );
    const childrenDepth02Filepaths = childrenFolderpaths.map(child => {
      const childNamepath = pathSplit(child);
      return {
        fileId: getNewIdForResource(kFimidaraResourceType.File),
        filepath: generateTestFilepathString({
          length: childNamepath.length + 1,
          parentNamepath: childNamepath,
        }),
      };
    });
    await Promise.all(
      childrenFilepaths
        .map(p =>
          backend.uploadFile({
            mount,
            workspaceId,
            filepath: p.filepath,
            fileId: p.fileId,
            body: Readable.from(buffer),
          })
        )
        .concat(
          childrenDepth02Filepaths.map(p =>
            backend.uploadFile({
              mount,
              workspaceId,
              filepath: p.filepath,
              fileId: p.fileId,
              body: Readable.from(buffer),
            })
          )
        )
    );

    let result = await backend.describeFolderContent({
      mount,
      workspaceId,
      folderpath,
      max: 5,
    });

    const resultFilepaths: string[] = [];
    const resultFolderpaths: string[] = [];
    expect(result.continuationToken).toBeTruthy();
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

    result = await backend.describeFolderContent({
      mount,
      workspaceId,
      folderpath,
      max: 5,
      continuationToken: result.continuationToken,
    });

    expect(result.continuationToken).toBeFalsy();
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

    expect(resultFilepaths).toEqual(
      expect.arrayContaining(childrenFilepaths.map(p => p.filepath))
    );
    expect(resultFolderpaths).toEqual(
      expect.arrayContaining(childrenFolderpaths)
    );
    expect(resultFilepaths).not.toEqual(
      expect.arrayContaining(childrenDepth02Filepaths.map(p => p.filepath))
    );
  });
});

class TestS3Provider extends S3FilePersistenceProvider {
  async uploadFile(
    params: FilePersistenceUploadFileParams
  ): Promise<FilePersistenceUploadFileResult> {
    const {nativePath} = this.toNativePath({
      fimidaraPath: params.filepath,
      mount: params.mount,
    });
    keysToCleanup.push(nativePath);
    const pFile = await super.uploadFile(params);

    return pFile;
  }

  async listFileMultipartUploads(
    params: Pick<FilePersistenceUploadFileParams, 'filepath' | 'mount'> & {
      size?: number;
    }
  ) {
    const {bucket, nativePath} = this.toNativePath({
      fimidaraPath: params.filepath,
      mount: params.mount,
    });
    const key = this.formatKey(nativePath, {removeStartingSeparator: true});
    const command = new ListMultipartUploadsCommand({
      Bucket: bucket,
      Prefix: key,
    });

    const result = await this.s3.send(command);
    return result;
  }
}

function getTestAWSConfig() {
  const conf = kIjxUtils.suppliedConfig();
  const awsCreds = merge(
    {},
    conf.awsConfigs?.all,
    conf.awsConfigs?.secretsManager
  );
  const s3Bucket = conf.awsConfigs?.s3Bucket;

  assert(awsCreds?.accessKeyId);
  assert(awsCreds?.region);
  assert(awsCreds?.secretAccessKey);
  assert(s3Bucket);

  return {awsCreds, bucket: s3Bucket};
}

function getS3BackendInstance() {
  const {awsCreds} = getTestAWSConfig();
  return new TestS3Provider(awsCreds);
}

async function getNewMount(seed: Partial<FileBackendMount>) {
  const {bucket} = getTestAWSConfig();
  const mountSeed = generateFileBackendMountForTest({
    ...seed,
    backend: kFileBackendType.s3,
    mountedFrom: [bucket].concat(prefix),
  });
  const [mount] = await generateAndInsertFileBackendMountListForTest(
    1,
    mountSeed
  );
  return mount;
}

async function expectFileNotFound(props: {
  backend: S3FilePersistenceProvider;
  mount: FileBackendMount;
  workspaceId: string;
  filepath: string;
  fileId: string;
}) {
  const {backend, mount, workspaceId, filepath, fileId} = props;

  try {
    await backend.readFile({mount, workspaceId, filepath, fileId});
    assert.fail();
  } catch (error) {
    expect((error as Error).name).toBe('NoSuchKey');
  }
}
