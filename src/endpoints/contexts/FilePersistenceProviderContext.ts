import {S3} from 'aws-sdk';
import {IAppVariables} from '../../resources/appVariables';
import {assertAWSConfigured} from '../../resources/aws';
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
  body?: Buffer;
}

export interface IFilePersistenceProviderContext {
  uploadFile: (params: IFilePersistenceUploadFileParams) => Promise<void>;
  getFile: (params: IFilePersistenceGetFileParams) => Promise<IPersistedFile>;
  deleteFiles: (params: IFilePersistenceDeleteFilesParams) => Promise<void>;
  ensureBucketReady: (name: string, region: string) => Promise<void>;
}

export class S3FilePersistenceProviderContext
  implements IFilePersistenceProviderContext
{
  protected s3: S3;

  constructor() {
    assertAWSConfigured();
    this.s3 = new S3();
  }

  public uploadFile = wrapFireAndThrowError(
    async (params: IFilePersistenceUploadFileParams) => {
      await this.s3
        .putObject({
          Bucket: params.bucket,
          Key: params.key,
          Body: params.body,
          ContentType: params.contentType,
          ContentEncoding: params.contentEncoding,
          ContentLength: params.contentLength,
        })
        .promise();
    }
  );

  public getFile = wrapFireAndThrowError(
    async (params: IFilePersistenceGetFileParams) => {
      const s3File = await this.s3
        .getObject({
          Bucket: params.bucket,
          Key: params.key,
        })
        .promise();

      return {body: <Buffer | undefined>s3File.Body};
    }
  );

  public deleteFiles = wrapFireAndThrowError(
    async (params: IFilePersistenceDeleteFilesParams) => {
      await this.s3
        .deleteObjects({
          Bucket: params.bucket,
          Delete: {
            Objects: params.keys.map(key => ({Key: key})),
            Quiet: false,
          },
        })
        .promise();
    }
  );

  public ensureBucketReady = wrapFireAndThrowError(
    async (name: string, region: string) => {
      const response = await this.s3
        .headBucket({
          Bucket: name,
        })
        .promise();

      const exists = 200;
      const notFound = 404;

      if (response.$response.httpResponse.statusCode === exists) {
        return;
      } else if (response.$response.httpResponse.statusCode === notFound) {
        await this.s3
          .createBucket({
            Bucket: name,
            ACL: 'private',
            CreateBucketConfiguration: {
              LocationConstraint: region,
            },
          })
          .promise();
      }
    }
  );
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
