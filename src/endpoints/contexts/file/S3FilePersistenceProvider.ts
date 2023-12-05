import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {first} from 'lodash';
import path from 'path';
import {Readable} from 'stream';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {kFolderConstants} from '../../folders/constants';
import {
  FilePersistenceDeleteFilesParams,
  FilePersistenceDeleteFoldersParams,
  FilePersistenceDescribeFolderFilesParams,
  FilePersistenceDescribeFolderFoldersParams,
  FilePersistenceDescribeFolderParams,
  FilePersistenceGetFileParams,
  FilePersistenceProvider,
  FilePersistenceProviderFeature,
  FilePersistenceUploadFileParams,
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
  static getBucketAndKey(
    params: Pick<FilePersistenceUploadFileParams, 'mount' | 'filepath'>
  ) {
    const {filepath, mount} = params;
    const bucket = first(mount.mountedFrom);
    const prefix = mount.mountedFrom.slice(0).join(kFolderConstants.separator);
    appAssert(bucket?.length, kReuseableErrors.mount.s3MountSourceMissingBucket());

    const key = path.normalize(
      `${prefix}/${filepath
        .split(kFolderConstants.separator)
        .slice(mount.folderpath.length)}`
    );

    return {bucket, key};
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
        return true;
      case 'deleteFolders':
        return false;
      case 'describeFile':
        return true;
      case 'describeFolder':
        return false;
      case 'describeFolderFiles':
        return false;
      case 'describeFolderFolders':
        return false;
      case 'readFile':
        return true;
      case 'uploadFile':
        return true;
    }
  };

  uploadFile = async (params: FilePersistenceUploadFileParams) => {
    const {bucket, key} = S3FilePersistenceProvider.getBucketAndKey(params);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: params.body,
      // ContentLength: params.contentLength,
      // ContentType: params.contentType,
      // ContentEncoding: params.contentEncoding,
    });
    await this.s3.send(command);

    return {};
  };

  readFile = async (params: FilePersistenceGetFileParams): Promise<PersistedFile> => {
    const {bucket, key} = S3FilePersistenceProvider.getBucketAndKey(params);
    const command = new GetObjectCommand({Bucket: bucket, Key: key});
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
      S3FilePersistenceProvider.getBucketAndKey({filepath, mount: params.mount})
    );
    const bucket = first(objectInfoList)?.bucket;
    appAssert(bucket);

    const command = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {Objects: objectInfoList.map(info => ({Key: info.key}))},
    });
    await this.s3.send(command);
  };

  close = async () => {
    await this.s3.destroy();
  };

  describeFile = async (
    params: FilePersistenceGetFileParams
  ): Promise<PersistedFileDescription | undefined> => {
    const {bucket, key} = S3FilePersistenceProvider.getBucketAndKey(params);
    const command = new HeadObjectCommand({Bucket: bucket, Key: key});
    const response = await this.s3.send(command);

    return {
      filepath: params.filepath,
      type: 'file',
      size: response.ContentLength,
      lastUpdatedAt: response.LastModified ? response.LastModified.valueOf() : undefined,
    };
  };

  describeFolder = async (
    params: FilePersistenceDescribeFolderParams
  ): Promise<PersistedFolderDescription | undefined> => {
    // not supported
    return undefined;
  };

  describeFolderFiles = async (params: FilePersistenceDescribeFolderFilesParams) => {
    // not supported
    return {files: []};
  };

  describeFolderFolders = async (params: FilePersistenceDescribeFolderFoldersParams) => {
    // not supported
    return {folders: []};
  };

  deleteFolders = async (params: FilePersistenceDeleteFoldersParams): Promise<void> => {
    // not supported
  };
}
