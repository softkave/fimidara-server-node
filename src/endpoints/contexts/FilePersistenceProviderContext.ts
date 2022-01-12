import aws from '../../resources/aws';
import {indexArray} from '../../utilities/indexArray';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';

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

class S3FilePersistenceProviderContext
  implements IFilePersistenceProviderContext {
  public s3 = new aws.S3();

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

export class TestFilePersistenceProviderContext
  implements IFilePersistenceProviderContext {
  public files: IFilePersistenceUploadFileParams[] = [];

  public uploadFile = wrapFireAndThrowError(
    async (params: IFilePersistenceUploadFileParams) => {
      this.files.push(params);
    }
  );

  public getFile = wrapFireAndThrowError(
    async (params: IFilePersistenceGetFileParams) => {
      const file = this.files.find(file => {
        return file.bucket === params.bucket && file.key === params.key;
      });

      return {body: file?.body};
    }
  );

  public deleteFiles = wrapFireAndThrowError(
    async (params: IFilePersistenceDeleteFilesParams) => {
      const keysMap = indexArray(params.keys);
      this.files = this.files.filter(file => {
        return !(file.bucket === params.bucket && keysMap[file.key]);
      });
    }
  );
}

export const getS3FilePersistenceProviderContext = singletonFunc(
  () => new S3FilePersistenceProviderContext()
);
