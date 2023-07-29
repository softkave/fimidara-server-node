import fse from 'fs-extra';
import {noopAsync} from '../../../utils/fns';
import {
  FilePersistenceDeleteFilesParams,
  FilePersistenceGetFileParams,
  FilePersistenceProviderContext,
  FilePersistenceUploadFileParams,
  IPersistedFile,
} from './types';

export default class LocalFsFilePersistenceProviderContext
  implements FilePersistenceProviderContext
{
  constructor(private fileDir: string) {
    fse.ensureDirSync(this.fileDir);
  }

  uploadFile = async (params: FilePersistenceUploadFileParams) => {
    const filepath = `${this.fileDir}/${params.key}`;
    await fse.ensureFile(filepath);
    return new Promise<void>((resolve, reject) => {
      const writeStream = fse.createWriteStream(filepath, {autoClose: true, emitClose: true});
      writeStream.on('close', resolve);
      writeStream.on('error', reject);
      params.body.pipe(writeStream);
    });
  };

  getFile = async (params: FilePersistenceGetFileParams): Promise<IPersistedFile> => {
    const filepath = `${this.fileDir}/${params.key}`;
    const stat = await fse.promises.stat(filepath);

    if (!stat.isFile()) {
      return {body: undefined};
    }

    const stream = fse.createReadStream(filepath, {autoClose: true});
    return {body: stream, contentLength: stat.size};
  };

  deleteFiles = async (params: FilePersistenceDeleteFilesParams) => {
    const rmPromises = params.keys.map(async key => {
      const filepath = `${this.fileDir}/${key}`;
      await fse.promises.rm(filepath);
    });
    await Promise.all(rmPromises);
  };

  ensureBucketReady = noopAsync;
  close = noopAsync;
}
