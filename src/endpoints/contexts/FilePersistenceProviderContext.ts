import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {Readable} from 'stream';
import {IAppVariables} from '../../resources/vars';
import {endpointConstants} from '../constants';

export interface IFilePersistenceUploadFileParams {
  bucket: string;
  key: string;
  body: Buffer;
  contentType?: string;
  contentEncoding?: string;
  contentLength?: number;
}

export interface IFilePersistenceGetFileParams {
  bucket: string;
  key: string;
}

export interface IFilePersistenceDeleteFilesParams {
  bucket: string;
  keys: string[];
}

export interface IPersistedFile {
  body?: Readable;
  contentLength?: number;
}

export interface IFilePersistenceProviderContext {
  uploadFile: (params: IFilePersistenceUploadFileParams) => Promise<void>;
  getFile: (params: IFilePersistenceGetFileParams) => Promise<IPersistedFile>;
  deleteFiles: (params: IFilePersistenceDeleteFilesParams) => Promise<void>;
  ensureBucketReady: (name: string, region: string) => Promise<void>;
  close: () => Promise<void>;
}

export class S3FilePersistenceProviderContext implements IFilePersistenceProviderContext {
  protected s3: S3Client;

  constructor(region: string) {
    this.s3 = new S3Client({region});
  }

  uploadFile = async (params: IFilePersistenceUploadFileParams) => {
    const command = new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      ContentEncoding: params.contentEncoding,
      ContentLength: params.contentLength,
    });

    await this.s3.send(command);
  };

  getFile = async (params: IFilePersistenceGetFileParams): Promise<IPersistedFile> => {
    const command = new GetObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
    });

    const response = await this.s3.send(command);
    return {
      body: <Readable | undefined>response.Body,
      contentLength: response.ContentLength,
    };
  };

  deleteFiles = async (params: IFilePersistenceDeleteFilesParams) => {
    if (params.keys.length === 0) {
      return;
    }

    const command = new DeleteObjectsCommand({
      Bucket: params.bucket,
      Delete: {
        Objects: params.keys.map(key => ({Key: key})),
        Quiet: false,
      },
    });

    await this.s3.send(command);
  };

  ensureBucketReady = async (name: string, region: string) => {
    const command = new HeadBucketCommand({
      Bucket: name,
    });

    const response = await this.s3.send(command);
    const exists = endpointConstants.httpStatusCode.ok;
    const notFound = endpointConstants.httpStatusCode.notFound;
    if (response.$metadata.httpStatusCode === exists) {
      return;
    } else if (response.$metadata.httpStatusCode === notFound) {
      const command = new CreateBucketCommand({
        Bucket: name,
        ACL: 'private',
        CreateBucketConfiguration: {
          LocationConstraint: region,
        },
      });

      await this.s3.send(command);
    }
  };

  close = async () => {
    await this.s3.destroy();
  };
}

export async function ensureAppBucketsReady(
  fileProvider: IFilePersistenceProviderContext,
  appVariables: IAppVariables
) {
  return Promise.all([fileProvider.ensureBucketReady(appVariables.S3Bucket, appVariables.awsRegion)]);
}

export function getBufferFromStream(body: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    body.once('error', err => reject(err));
    body.on('data', chunk => chunks.push(chunk));
    body.once('end', () => resolve(Buffer.concat(chunks)));
  });
}
