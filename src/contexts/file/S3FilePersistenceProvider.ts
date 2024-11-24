import {
  AbortMultipartUploadCommand,
  CompletedPart,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  ListMultipartUploadsCommand,
  ListObjectsV2Command,
  ObjectIdentifier,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import {Upload} from '@aws-sdk/lib-storage';
import {first, isNumber} from 'lodash-es';
import {AnyObject} from 'softkave-js-utils';
import {Readable} from 'stream';
import {FileBackendMount} from '../../definitions/fileBackend.js';
import {getPartMetas} from '../../endpoints/files/utils/partMeta.js';
import {kFolderConstants} from '../../endpoints/folders/constants.js';
import {appAssert} from '../../utils/assertion.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {
  FilePersistenceCleanupMultipartUploadParams,
  FilePersistenceCompleteMultipartUploadParams,
  FilePersistenceDeleteFilesParams,
  FilePersistenceDeleteFoldersParams,
  FilePersistenceDescribeFileParams,
  FilePersistenceDescribeFolderContentParams,
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
    appAssert(
      bucket?.length,
      kReuseableErrors.mount.s3MountSourceMissingBucket()
    );
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

    if (isNumber(params.part)) {
      if (!(await this.hasMultipartsUploads(bucket, nativePath))) {
        params.multipartId = await this.startMultipartUpload(
          bucket,
          nativePath
        );
      }

      appAssert(params.multipartId);
      const response = await this.uploadPart(bucket, nativePath, params);

      return {
        filepath: params.filepath,
        raw: response,
        partId: response.ETag,
        part: params.part,
        multipartId: params.multipartId,
      };
    } else {
      const response = await this.parrallelUpload(bucket, nativePath, params);
      return {filepath: params.filepath, raw: response};
    }
  }

  readFile = async (
    params: FilePersistenceGetFileParams
  ): Promise<PersistedFile> => {
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
        Key: this.formatKey(nativeInfo.nativePath, {
          removeStartingSeparator: true,
        }),
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
  ): Promise<PersistedFileDescription<HeadObjectCommandOutput> | undefined> => {
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
      lastUpdatedAt: response.LastModified
        ? response.LastModified.valueOf()
        : undefined,
      mountId: params.mount.resourceId,
      encoding: response.ContentEncoding,
      mimetype: response.ContentType,
      raw: response,
    };
  };

  describeFolder = async (params: FilePersistenceDescribeFolderParams) => {
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
  ) => {
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

    const files: PersistedFileDescription<AnyObject>[] = [];
    const folders: PersistedFolderDescription<AnyObject>[] = [];

    response.Contents?.forEach(content => {
      if (!content.Key) {
        return;
      }

      files.push({
        filepath: this.toFimidaraPath({
          nativePath: content.Key,
          mount: params.mount,
        }).fimidaraPath,
        size: content.Size,
        lastUpdatedAt: content.LastModified
          ? content.LastModified.valueOf()
          : undefined,
        mountId: params.mount.resourceId,
        raw: response,
      });
    });

    response.CommonPrefixes?.forEach(content => {
      if (!content.Prefix) {
        return;
      }

      folders.push({
        folderpath: this.toFimidaraPath({
          nativePath: content.Prefix,
          mount: params.mount,
        }).fimidaraPath,
        mountId: params.mount.resourceId,
        raw: response,
      });
    });

    return {files, folders, continuationToken: response.NextContinuationToken};
  };

  describeFolderFolders = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: FilePersistenceDescribeFolderFoldersParams
  ) => {
    // not supported
    return {folders: []};
  };

  deleteFolders = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: FilePersistenceDeleteFoldersParams
  ): Promise<void> => {
    // not supported
  };

  toNativePath = (params: FimidaraToFilePersistencePathParams) => {
    const {fimidaraPath, mount} = params;
    const {bucket, prefix} =
      S3FilePersistenceProvider.getBucketAndPrefix(params);
    const nativePath = defaultToNativePath(
      {mountedFrom: prefix, namepath: mount.namepath},
      fimidaraPath,
      prefix
    );
    return {nativePath, bucket, prefix};
  };

  toFimidaraPath = (
    params: FilePersistenceToFimidaraPathParams
  ): FilePersistenceToFimidaraPathResult => {
    const {nativePath, mount} = params;
    const {prefix} = S3FilePersistenceProvider.getBucketAndPrefix(params);
    const fimidaraPath = defaultToFimidaraPath(
      {mountedFrom: prefix, namepath: mount.namepath},
      nativePath,
      prefix
    );
    return {fimidaraPath};
  };

  async completeMultipartUpload(
    params: FilePersistenceCompleteMultipartUploadParams
  ) {
    const {bucket, nativePath} = this.toNativePath({
      fimidaraPath: params.filepath,
      mount: params.mount,
    });

    const parts = (await getPartMetas(params)).map(
      (part): CompletedPart => ({
        PartNumber: part.part,
        ETag: part.partId,
      })
    );

    const command = new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: nativePath,
      UploadId: params.multipartId,
      MultipartUpload: {Parts: parts},
    });

    await this.s3.send(command);
  }

  async cleanupMultipartUpload(
    params: FilePersistenceCleanupMultipartUploadParams
  ) {
    const {bucket, nativePath} = this.toNativePath({
      fimidaraPath: params.filepath,
      mount: params.mount,
    });

    const command = new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: nativePath,
      UploadId: params.multipartId,
    });

    await this.s3.send(command);
  }

  protected formatKey(
    key: string,
    options: {
      removeStartingSeparator?: boolean;
      addEndingSeparator?: boolean;
    }
  ) {
    const {removeStartingSeparator = true, addEndingSeparator = false} =
      options;

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

  protected async hasMultipartsUploads(bucket: string, key: string) {
    const command = new ListMultipartUploadsCommand({
      Bucket: bucket,
      Prefix: key,
      MaxUploads: 1,
    });
    const response = await this.s3.send(command);
    return !!response.Uploads?.length;
  }

  protected async startMultipartUpload(bucket: string, key: string) {
    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
    });
    const response = await this.s3.send(command);
    return response.UploadId;
  }

  protected async uploadPart(
    bucket: string,
    key: string,
    params: FilePersistenceUploadFileParams
  ) {
    appAssert(isNumber(params.part));
    appAssert(params.multipartId);
    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: key,
      UploadId: params.multipartId,
      PartNumber: params.part,
      Body: params.body,
    });

    const response = await this.s3.send(command);
    return response;
  }

  protected async parrallelUpload(
    bucket: string,
    nativePath: string,
    params: FilePersistenceUploadFileParams
  ) {
    const upload = new Upload({
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

    const response = await upload.done();
    return response;
  }
}
