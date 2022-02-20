import {S3} from 'aws-sdk';
import {assertAWSConfigured} from '../../resources/aws';
import {indexArray} from '../../utilities/indexArray';
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
}

export class S3FilePersistenceProviderContext
  implements IFilePersistenceProviderContext {
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
}
