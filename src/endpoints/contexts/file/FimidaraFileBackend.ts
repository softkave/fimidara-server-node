import {finished} from 'stream';
import {container} from 'tsyringe';
import {noopAsync} from '../../../utils/fns';
import {kInjectionKeys} from '../injection';
import {
  FileBackendDeleteFileVersionParams,
  FileBackendPersistFileParams,
  FileBackendProvider,
  FilePersistenceProvider,
} from './types';

export class FimidaraFileBackend implements FileBackendProvider {
  persistFile = async (params: FileBackendPersistFileParams) => {
    const {file, data} = params;

    const fs = container.resolve<FilePersistenceProvider>(
      kInjectionKeys.filePersistence.fs
    );

    const currentKey = `${file.resourceId}-v${file.version + 1}`;
    await fs.uploadFile({
      bucket: '',
      key: currentKey,
      body: data,
    });

    await finished(data, err => {
      throw err;
    });

    return {head: currentKey};
  };

  deleteVersion = async (params: FileBackendDeleteFileVersionParams) => {
    const {file, version} = params;

    const fs = container.resolve<FilePersistenceProvider>(
      kInjectionKeys.filePersistence.fs
    );

    const key = `${file.resourceId}-v${version}`;
    fs.deleteFiles({
      bucket: '',
      keys: [key],
    }).catch(error => {
      console.error(`Error deleting previous file version ${key}`);
      console.error(error);
    });
  };

  close = noopAsync;
}
