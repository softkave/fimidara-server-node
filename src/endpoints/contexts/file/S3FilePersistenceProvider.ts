import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ObjectIdentifier,
  S3Client,
} from '@aws-sdk/client-s3';
import {Upload} from '@aws-sdk/lib-storage';
import {first} from 'lodash';
import {Readable} from 'stream';
import {FileBackendMount} from '../../../definitions/fileBackend.js';
import {appAssert} from '../../../utils/assertion.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {kFolderConstants} from '../../folders/constants.js';
import {
  FilePersistenceDeleteFilesParams,
  FilePersistenceDeleteFoldersParams,
  FilePersistenceDescribeFileParams,
  FilePersistenceDescribeFolderContentParams,
  FilePersistenceDescribeFolderContentResult,
  FilePersistenceDescribeFolderFoldersParams,
  FilePersistenceDescribeFolderParams,
  FilePersistenceGetFileParams,
  FilePersistenceProvider,
  FilePersistenceProviderFeature,
  FilePersistenceToFimidaraPathParams,
  FilePersistenceToFimidaraPathResult,
  FilePersistenceUploadFileParams,
  FimidaraToFilePersistencePathParams,
  PersistedFile,
  PersistedFileDescription,
  PersistedFolderDescription,
} from './types.js';
import {defaultToFimidaraPath, defaultToNativePath} from './utils.js';

export interface S3FilePersistenceProviderInitParams {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export class S3FilePersistenceProvider implements FilePersistenceProvider {
  static getBucketAndPrefix(params: {
    mount: FileBackendMount;
    filepath?: string;
    folderpath?: string;
  }) {
    const {mount} = params;
    const bucket = first(mount.mountedFrom);
    const prefix = mount.mountedFrom.slice(1);
    appAssert(bucket?.length, kReuseableErrors.mount.s3MountSourceMissingBucket());
    return {bucket, prefix};
  }

  protected s3: S3Client;

  constructor(params: S3FilePersistenceProviderInitParams) {
    this.s3 = new S3Client({
      region: params.region,
      credentials: {
        accessKeyId: params.accessKeyId,
        secretAccessKey: params.secretAccessKey,
      },
    });
  }

  supportsFeature = (feature: FilePersistenceProviderFeature): boolean => {
    switch (feature) {
      case 'deleteFiles':
      case 'describeFile':
      case 'describeFolderContent':
      case 'readFile':
      case 'uploadFile':
      case 'describeFolder':
        return true;
      case 'deleteFolders':
        // TODO: implement delete folders using job
        return false;
    }
  };

  async uploadFile(params: FilePersistenceUploadFileParams) {
    const {bucket, nativePath} = this.toNativePath({
      fimidaraPath: params.filepath,
      mount: params.mount,
    });
    const parallelUploads3 = new Upload({
      client: this.s3,
      params: {
        Bucket: bucket,
        Key: this.formatKey(nativePath, {removeStartingSeparator: true}),
        Body: params.body,
        ContentType: params.mimetype,
        ContentEncoding: params.encoding,
      },
      queueSize: 4,
      partSize: 1024 * 1024 * 5, // 5MB
      leavePartsOnError: false,
    });

    const response = await parallelUploads3.done();
    return {filepath: params.filepath, raw: response};
  }

  readFile = async (params: FilePersistenceGetFileParams): Promise<PersistedFile> => {
    const {bucket, nativePath} = this.toNativePath({
      fimidaraPath: params.filepath,
      mount: params.mount,
    });
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: this.formatKey(nativePath, {removeStartingSeparator: true}),
    });
    const response = await this.s3.send(command);

    return {
      body: <Readable | undefined>response.Body,
      size: response.ContentLength,
    };
  };

  deleteFiles = async (params: FilePersistenceDeleteFilesParams) => {
    if (params.files.length === 0) {
      // Short-circuit, no files to delete
      return;
    }

    let bucket: string | undefined;
    const ids: ObjectIdentifier[] = params.files.map(({filepath}) => {
      const nativeInfo = this.toNativePath({
        fimidaraPath: filepath,
        mount: params.mount,
      });
      bucket = nativeInfo.bucket;
      return {
        Key: this.formatKey(nativeInfo.nativePath, {removeStartingSeparator: true}),
      };
    });

    appAssert(bucket);
    await this.deleteFilesUsingObjectIds({bucket, ids});
  };

  deleteFilesUsingObjectIds = async (params: {
    bucket: string;
    ids: ObjectIdentifier[];
  }) => {
    const command = new DeleteObjectsCommand({
      Bucket: params.bucket,
      Delete: {
        Objects: params.ids,
      },
    });
    await this.s3.send(command);
  };

  dispose = async () => {
    await this.s3.destroy();
  };

  describeFile = async (
    params: FilePersistenceDescribeFileParams
  ): Promise<PersistedFileDescription | undefined> => {
    const {bucket, nativePath} = this.toNativePath({
      fimidaraPath: params.filepath,
      mount: params.mount,
    });
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: this.formatKey(nativePath, {removeStartingSeparator: true}),
    });
    const response = await this.s3.send(command);

    return {
      filepath: params.filepath,
      size: response.ContentLength,
      lastUpdatedAt: response.LastModified ? response.LastModified.valueOf() : undefined,
      mountId: params.mount.resourceId,
      encoding: response.ContentEncoding,
      mimetype: response.ContentType,
      raw: response,
    };
  };

  describeFolder = async (
    params: FilePersistenceDescribeFolderParams
  ): Promise<PersistedFolderDescription | undefined> => {
    const {bucket, nativePath} = this.toNativePath({
      fimidaraPath: params.folderpath,
      mount: params.mount,
    });
    const prefix = this.formatKey(nativePath, {
      removeStartingSeparator: true,
      addEndingSeparator: true,
    });
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 1,
      Prefix: prefix,
      Delimiter: kFolderConstants.separator,
    });
    const response = await this.s3.send(command);

    // As long as it doesn't throw a NoSuchKey error, then it exists
    return {
      folderpath: params.folderpath,
      mountId: params.mount.resourceId,
      raw: response,
    };
  };

  describeFolderContent = async (
    params: FilePersistenceDescribeFolderContentParams
  ): Promise<FilePersistenceDescribeFolderContentResult> => {
    const {bucket, nativePath} = this.toNativePath({
      fimidaraPath: params.folderpath,
      mount: params.mount,
    });
    const prefix = this.formatKey(nativePath, {
      removeStartingSeparator: true,
      addEndingSeparator: true,
    });
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: params.max,
      Prefix: prefix,
      Delimiter: kFolderConstants.separator,
      ContinuationToken: params.continuationToken as string | undefined,
    });
    const response = await this.s3.send(command);

    const files: PersistedFileDescription[] = [];
    const folders: PersistedFolderDescription[] = [];

    response.Contents?.forEach(content => {
      if (!content.Key) {
        return;
      }

      files.push({
        filepath: this.toFimidaraPath({nativePath: content.Key, mount: params.mount})
          .fimidaraPath,
        size: content.Size,
        lastUpdatedAt: content.LastModified ? content.LastModified.valueOf() : undefined,
        mountId: params.mount.resourceId,
        raw: response,
      });
    });

    response.CommonPrefixes?.forEach(content => {
      if (!content.Prefix) {
        return;
      }

      folders.push({
        folderpath: this.toFimidaraPath({nativePath: content.Prefix, mount: params.mount})
          .fimidaraPath,
        mountId: params.mount.resourceId,
        raw: response,
      });
    });

    return {files, folders, continuationToken: response.NextContinuationToken};
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  describeFolderFolders = async (params: FilePersistenceDescribeFolderFoldersParams) => {
    // not supported
    return {folders: []};
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteFolders = async (params: FilePersistenceDeleteFoldersParams): Promise<void> => {
    // not supported
  };

  toNativePath = (params: FimidaraToFilePersistencePathParams) => {
    const {fimidaraPath, mount, postMountedFromPrefix} = params;
    const {bucket, prefix} = S3FilePersistenceProvider.getBucketAndPrefix(params);
    const nativePath = defaultToNativePath(
      {mountedFrom: prefix, namepath: mount.namepath},
      fimidaraPath,
      prefix,
      postMountedFromPrefix
    );
    return {nativePath, bucket, prefix};
  };

  toFimidaraPath = (
    params: FilePersistenceToFimidaraPathParams
  ): FilePersistenceToFimidaraPathResult => {
    const {nativePath, mount, postMountedFromPrefix} = params;
    const {prefix} = S3FilePersistenceProvider.getBucketAndPrefix(params);
    const fimidaraPath = defaultToFimidaraPath(
      {mountedFrom: prefix, namepath: mount.namepath},
      nativePath,
      prefix,
      postMountedFromPrefix
    );
    return {fimidaraPath};
  };

  formatKey(
    key: string,
    options: {
      removeStartingSeparator?: boolean;
      addEndingSeparator?: boolean;
    }
  ) {
    const {removeStartingSeparator = true, addEndingSeparator = false} = options;

    if (removeStartingSeparator) {
      if (key[0] === kFolderConstants.separator) {
        key = key.slice(1);
      }
    }

    if (addEndingSeparator) {
      key = key + kFolderConstants.separator;
    }

    return key;
  }
}
