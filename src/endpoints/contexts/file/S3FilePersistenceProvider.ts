import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {Readable} from 'stream';
import {
  FilePersistenceDeleteFilesParams,
  FilePersistenceGetFileParams,
  FilePersistenceProvider,
  FilePersistenceUploadFileParams,
  PersistedFile,
} from './types';

export interface S3FilePersistenceProviderInitParams {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export class S3FilePersistenceProvider implements FilePersistenceProvider {
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

  uploadFile = async (params: FilePersistenceUploadFileParams) => {
    const command = new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.filepath,
      Body: params.body,
      // ContentLength: params.contentLength,
      // ContentType: params.contentType,
      // ContentEncoding: params.contentEncoding,
    });
    await this.s3.send(command);
  };

  readFile = async (params: FilePersistenceGetFileParams): Promise<PersistedFile> => {
    const command = new GetObjectCommand({Bucket: params.bucket, Key: params.filepath});
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

    const command = new DeleteObjectsCommand({
      Bucket: params.bucket,
      Delete: {Objects: params.filepaths.map(key => ({Key: key})), Quiet: false},
    });
    await this.s3.send(command);
  };

  close = async () => {
    await this.s3.destroy();
  };
}
