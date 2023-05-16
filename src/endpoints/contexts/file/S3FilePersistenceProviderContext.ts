import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {Readable} from 'stream';
import {AppVariables} from '../../../resources/types';
import {endpointConstants} from '../../constants';
import {
  FilePersistenceDeleteFilesParams,
  FilePersistenceGetFileParams,
  FilePersistenceProviderContext,
  FilePersistenceUploadFileParams,
  IPersistedFile,
} from './types';

export class S3FilePersistenceProviderContext implements FilePersistenceProviderContext {
  protected s3: S3Client;

  constructor(region: string) {
    this.s3 = new S3Client({region});
  }

  uploadFile = async (params: FilePersistenceUploadFileParams) => {
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

  getFile = async (params: FilePersistenceGetFileParams): Promise<IPersistedFile> => {
    const command = new GetObjectCommand({Bucket: params.bucket, Key: params.key});
    const response = await this.s3.send(command);
    return {body: <Readable | undefined>response.Body, contentLength: response.ContentLength};
  };

  deleteFiles = async (params: FilePersistenceDeleteFilesParams) => {
    if (params.keys.length === 0) {
      return;
    }

    const command = new DeleteObjectsCommand({
      Bucket: params.bucket,
      Delete: {Objects: params.keys.map(key => ({Key: key})), Quiet: false},
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
        CreateBucketConfiguration: {LocationConstraint: region},
      });
      await this.s3.send(command);
    }
  };

  close = async () => {
    await this.s3.destroy();
  };
}

export async function ensureAppBucketsReady(
  fileProvider: FilePersistenceProviderContext,
  appVariables: AppVariables
) {
  return Promise.all([
    fileProvider.ensureBucketReady(appVariables.S3Bucket, appVariables.awsRegion),
  ]);
}

export function getBufferFromStream(body: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    body.once('error', err => reject(err));
    body.on('data', chunk => chunks.push(chunk));
    body.once('end', () => resolve(Buffer.concat(chunks)));
  });
}
