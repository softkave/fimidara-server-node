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
import {first, merge} from 'lodash-es';
import {AnyObject} from 'softkave-js-utils';
import {Readable} from 'stream';
import {kFolderConstants} from '../../endpoints/folders/constants.js';
import {FimidaraSuppliedConfig} from '../../resources/config.js';
import {appAssert} from '../../utils/assertion.js';
import {streamToBuffer} from '../../utils/fns.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {kIjxUtils} from '../ijx/injectables.js';
import {
  FilePersistenceCleanupMultipartUploadParams,
  FilePersistenceCompleteMultipartUploadParams,
  FilePersistenceCompleteMultipartUploadResult,
  FilePersistenceDeleteFilesParams,
  FilePersistenceDeleteFoldersParams,
  FilePersistenceDeleteMultipartUploadPartParams,
  FilePersistenceDescribeFileParams,
  FilePersistenceDescribeFolderContentParams,
  FilePersistenceDescribeFolderFoldersParams,
  FilePersistenceDescribeFolderParams,
  FilePersistenceGetFileParams,
  FilePersistenceProvider,
  FilePersistenceProviderFeature,
  FilePersistenceStartMultipartUploadParams,
  FilePersistenceStartMultipartUploadResult,
  FilePersistenceToFimidaraPathParams,
  FilePersistenceToFimidaraPathResult,
  FilePersistenceUploadFileParams,
  FilePersistenceUploadFileResult,
  FimidaraToFilePersistencePathParams,
  IFilePersistenceProviderMount,
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
    mount: IFilePersistenceProviderMount;
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

  async uploadFile(
    params: FilePersistenceUploadFileParams
  ): Promise<FilePersistenceUploadFileResult> {
    const {bucket, nativePath} = this.toNativePath({
      fimidaraPath: params.filepath,
      mount: params.mount,
    });

    if (params.multipartId) {
      const response = await this.uploadPart(
        bucket,
        nativePath,
        params.multipartId,
        params
      );
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

  async startMultipartUpload(
    params: FilePersistenceStartMultipartUploadParams
  ): Promise<FilePersistenceStartMultipartUploadResult> {
    const {bucket, nativePath} = this.toNativePath({
      fimidaraPath: params.filepath,
      mount: params.mount,
    });
    const key = this.formatKey(nativePath, {removeStartingSeparator: true});
    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
    });
    const response = await this.s3.send(command);
    appAssert(response.UploadId);
    return {multipartId: response.UploadId};
  }

  async deleteMultipartUploadPart(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _params: FilePersistenceDeleteMultipartUploadPartParams
  ) {
    // not supported
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
  ): Promise<FilePersistenceCompleteMultipartUploadResult> {
    const {bucket, nativePath} = this.toNativePath({
      fimidaraPath: params.filepath,
      mount: params.mount,
    });

    const parts = params.parts.map(
      (part): CompletedPart => ({
        PartNumber: part.part,
        ETag: part.partId,
      })
    );
    const key = this.formatKey(nativePath, {removeStartingSeparator: true});
    const command = new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: params.multipartId,
      MultipartUpload: {Parts: parts},
    });

    const result = await this.s3.send(command);
    return {
      filepath: params.filepath,
      raw: result,
    };
  }

  async cleanupMultipartUpload(
    params: FilePersistenceCleanupMultipartUploadParams
  ) {
    const {bucket, nativePath} = this.toNativePath({
      fimidaraPath: params.filepath,
      mount: params.mount,
    });
    const key = this.formatKey(nativePath, {removeStartingSeparator: true});
    const command = new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
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
    key = this.formatKey(key, {removeStartingSeparator: true});
    const command = new ListMultipartUploadsCommand({
      Bucket: bucket,
      Prefix: key,
      MaxUploads: 1,
    });
    const response = await this.s3.send(command);
    return !!response.Uploads?.length;
  }

  protected async uploadPart(
    bucket: string,
    key: string,
    multipartId: string,
    params: FilePersistenceUploadFileParams
  ) {
    key = this.formatKey(key, {removeStartingSeparator: true});

    // TODO: implement a better way to handle this without buffering
    const buffer = await streamToBuffer(params.body);
    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: key,
      UploadId: multipartId,
      PartNumber: params.part,
      Body: buffer,
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

export function getAWSS3ConfigFromSuppliedConfig(
  config: FimidaraSuppliedConfig = kIjxUtils.suppliedConfig()
) {
  const awsCreds = merge({}, config.awsConfigs?.all, config.awsConfigs?.s3);
  const s3Bucket = config.awsConfigs?.s3Bucket;

  appAssert(awsCreds, 'No AWS config provided for AWS S3 provider');
  appAssert(
    awsCreds?.accessKeyId,
    'No AWS accessKeyId provided for AWS S3 provider'
  );
  appAssert(awsCreds?.region, 'No AWS region provided for AWS S3 provider');
  appAssert(
    awsCreds?.secretAccessKey,
    'No AWS secretAccessKey provided for AWS S3 provider'
  );
  appAssert(s3Bucket, 'No AWS S3 bucket provided for AWS S3 provider');

  return {
    accessKeyId: awsCreds.accessKeyId,
    secretAccessKey: awsCreds.secretAccessKey,
    region: awsCreds.region,
    bucket: s3Bucket,
  };
}
