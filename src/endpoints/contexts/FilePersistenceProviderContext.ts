import aws from '../../resources/aws';
import {wrapFireAndThrowError} from '../../utilities/promiseFns';
import singletonFunc from '../../utilities/singletonFunc';

export interface IUploadFileParams {
  bucket: string;
  key: string;
  body: Buffer;
  contentType?: string;
  contentEncoding?: string;
  contentLength?: number;
}

export interface IGetFileParams {
  bucket: string;
  key: string;
}

export interface IPersistedFile {
  body?: Buffer;
}

export interface IFilePersistenceProviderContext {
  uploadFile: (params: IUploadFileParams) => Promise<void>;
  getFile: (params: IGetFileParams) => Promise<IPersistedFile>;
}

class FilePersistenceProviderContext
  implements IFilePersistenceProviderContext {
  public s3 = new aws.S3();

  public uploadFile = wrapFireAndThrowError(
    async (params: IUploadFileParams) => {
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

  public getFile = wrapFireAndThrowError(async (params: IGetFileParams) => {
    const s3File = await this.s3
      .getObject({
        Bucket: params.bucket,
        Key: params.key,
      })
      .promise();

    return {body: <Buffer>s3File.Body};
  });
}

export const getFilePersistenceProviderContext = singletonFunc(
  () => new FilePersistenceProviderContext()
);
