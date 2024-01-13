import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {first} from 'lodash';
import path from 'path';
import {Readable} from 'stream';
import {FileBackendMount} from '../../../definitions/fileBackend';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {kFolderConstants} from '../../folders/constants';
import {
  FilePersistenceDeleteFilesParams,
  FilePersistenceDeleteFoldersParams,
  FilePersistenceDescribeFolderFilesParams,
  FilePersistenceDescribeFolderFilesResult,
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
} from './types';

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
    const prefix = mount.mountedFrom.slice(1).join(kFolderConstants.separator);
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
      case 'describeFolderFiles':
      case 'readFile':
      case 'uploadFile':
        return true;
      case 'deleteFolders':
      case 'describeFolder':
      case 'describeFolderFolders':
        return false;
    }
  };

  uploadFile = async (params: FilePersistenceUploadFileParams) => {
    const {bucket, nativePath} = this.toNativePath({
      fimidaraPath: params.filepath,
      mount: params.mount,
    });
    appAssert(nativePath);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: nativePath,
      Body: params.body,
      // ContentLength: params.contentLength,
      // ContentType: params.contentType,
      // ContentEncoding: params.contentEncoding,
    });
    await this.s3.send(command);

    return {};
  };

  readFile = async (params: FilePersistenceGetFileParams): Promise<PersistedFile> => {
    const {bucket, nativePath} = this.toNativePath({
      fimidaraPath: params.filepath,
      mount: params.mount,
    });
    const command = new GetObjectCommand({Bucket: bucket, Key: nativePath});
    const response = await this.s3.send(command);

    return {
      body: <Readable | undefined>response.Body,
      size: response.ContentLength,
    };
  };

  deleteFiles = async (params: FilePersistenceDeleteFilesParams) => {
    if (params.filepaths.length === 0) {
      // Short-circuit, no files to delete
      return;
    }

    const objectInfoList = params.filepaths.map(filepath =>
      this.toNativePath({fimidaraPath: filepath, mount: params.mount})
    );
    const bucket = first(objectInfoList)?.bucket;
    appAssert(bucket);

    const command = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {Objects: objectInfoList.map(info => ({Key: info.nativePath}))},
    });
    await this.s3.send(command);
  };

  dispose = async () => {
    await this.s3.destroy();
  };

  describeFile = async (
    params: FilePersistenceGetFileParams
  ): Promise<PersistedFileDescription | undefined> => {
    const {bucket, nativePath} = this.toNativePath({
      fimidaraPath: params.filepath,
      mount: params.mount,
    });
    const command = new HeadObjectCommand({Bucket: bucket, Key: nativePath});
    const response = await this.s3.send(command);

    return {
      filepath: params.filepath,
      size: response.ContentLength,
      lastUpdatedAt: response.LastModified ? response.LastModified.valueOf() : undefined,
      mountId: params.mount.resourceId,
      encoding: response.ContentEncoding,
      mimetype: response.ContentType,
    };
  };

  describeFolder = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: FilePersistenceDescribeFolderParams
  ): Promise<PersistedFolderDescription | undefined> => {
    // not supported
    return undefined;
  };

  describeFolderFiles = async (
    params: FilePersistenceDescribeFolderFilesParams
  ): Promise<FilePersistenceDescribeFolderFilesResult> => {
    const {bucket, nativePath} = this.toNativePath({
      fimidaraPath: params.folderpath,
      mount: params.mount,
    });
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: params.max,
      Prefix: nativePath,
      ContinuationToken: params.continuationToken as string | undefined,
    });
    const response = await this.s3.send(command);

    const files: PersistedFileDescription[] = [];
    response.Contents?.forEach(content => {
      if (!content.Key) {
        return;
      }

      const pFile: PersistedFileDescription = {
        filepath: this.toFimidaraPath({nativePath: content.Key, mount: params.mount})
          .fimidaraPath,
        size: content.Size,
        lastUpdatedAt: content.LastModified ? content.LastModified.valueOf() : undefined,
        mountId: params.mount.resourceId,
      };

      files.push(pFile);
    });

    return {files, continuationToken: response.NextContinuationToken};
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
    const {fimidaraPath} = params;
    const {bucket, prefix} = S3FilePersistenceProvider.getBucketAndPrefix(params);
    const nativePath = path.normalize(
      [prefix].concat(fimidaraPath).join(kFolderConstants.separator)
    );
    return {nativePath, bucket, prefix};
  };

  toFimidaraPath = (
    params: FilePersistenceToFimidaraPathParams
  ): FilePersistenceToFimidaraPathResult => {
    const {nativePath} = params;
    const {prefix} = S3FilePersistenceProvider.getBucketAndPrefix(params);
    const fimidaraPath = nativePath.slice(prefix.length);
    return {fimidaraPath};
  };
}
