import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import {Readable} from 'stream';
import {IAppVariables} from '../../resources/appVariables';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';

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
}

export interface IFilePersistenceProviderContext {
  uploadFile: (params: IFilePersistenceUploadFileParams) => Promise<void>;
  getFile: (params: IFilePersistenceGetFileParams) => Promise<IPersistedFile>;
  deleteFiles: (params: IFilePersistenceDeleteFilesParams) => Promise<void>;
  ensureBucketReady: (name: string, region: string) => Promise<void>;
  close: () => Promise<void>;
}

export class S3FilePersistenceProviderContext
  implements IFilePersistenceProviderContext
{
  protected s3: S3Client;

  constructor(region: string) {
    this.s3 = new S3Client({region});
  }

  public uploadFile = wrapFireAndThrowError(
    async (params: IFilePersistenceUploadFileParams) => {
      const command = new PutObjectCommand({
        Bucket: params.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
        ContentEncoding: params.contentEncoding,
        ContentLength: params.contentLength,
      });

      const response = await this.s3.send(command);
    }
  );

  public getFile = wrapFireAndThrowError(
    async (params: IFilePersistenceGetFileParams) => {
      const command = new GetObjectCommand({
        Bucket: params.bucket,
        Key: params.key,
      });

      const response = await this.s3.send(command);
      return {body: response.Body};
    }
  );

  public deleteFiles = wrapFireAndThrowError(
    async (params: IFilePersistenceDeleteFilesParams) => {
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

      const response = await this.s3.send(command);
    }
  );

  public ensureBucketReady = wrapFireAndThrowError(
    async (name: string, region: string) => {
      const command = new HeadBucketCommand({
        Bucket: name,
      });

      const response = await this.s3.send(command);
      const exists = 200;
      const notFound = 404;

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

        const response = await this.s3.send(command);
      }
    }
  );

  public close = wrapFireAndThrowError(async () => {
    await this.s3.destroy();
  });
}

export async function ensureAppBucketsReady(
  fileProvider: IFilePersistenceProviderContext,
  appVariables: IAppVariables
) {
  return Promise.all([
    fileProvider.ensureBucketReady(
      appVariables.S3Bucket,
      appVariables.awsRegion
    ),
  ]);
}

export function getBodyFromStream(body: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let chunks: Buffer[] = [];
    body.once('error', err => reject(err));
    body.on('data', chunk => chunks.push(chunk));
    body.once('end', () => resolve(Buffer.concat(chunks)));
  });
}
