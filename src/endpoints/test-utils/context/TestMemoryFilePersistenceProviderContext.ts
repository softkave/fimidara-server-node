import {indexArray} from '../../../utilities/indexArray';
import {
  IFilePersistenceUploadFileParams,
  IFilePersistenceGetFileParams,
  IFilePersistenceDeleteFilesParams,
} from '../../contexts/FilePersistenceProviderContext';
import {ITestFilePersistenceProviderContext} from './types';

export default class TestMemoryFilePersistenceProviderContext
  implements ITestFilePersistenceProviderContext {
  public files: IFilePersistenceUploadFileParams[] = [];

  public uploadFile = jest.fn(
    async (params: IFilePersistenceUploadFileParams) => {
      this.files.push(params);
    }
  );

  public getFile = jest.fn(async (params: IFilePersistenceGetFileParams) => {
    const file = this.files.find(file => {
      return file.bucket === params.bucket && file.key === params.key;
    });

    return {body: file?.body};
  });

  public deleteFiles = jest.fn(
    async (params: IFilePersistenceDeleteFilesParams) => {
      const keysMap = indexArray(params.keys);
      this.files = this.files.filter(file => {
        return !(file.bucket === params.bucket && keysMap[file.key]);
      });
    }
  );
}
