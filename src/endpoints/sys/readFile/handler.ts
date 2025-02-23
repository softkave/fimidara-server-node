import {Readable} from 'stream';
import {FimidaraFilePersistenceProvider} from '../../../contexts/file/FimidaraFilePersistenceProvider.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {kFimidaraConfigFilePersistenceProvider} from '../../../resources/config.js';
import {validate} from '../../../utils/validate.js';
import {getSysOpMount} from '../utils/getSysOpMount.js';
import {SysReadFileEndpoint} from './types.js';
import {sysReadFileJoiSchema} from './validation.js';
import {stringifyFilenamepath} from '../../files/utils.js';

const sysReadFile: SysReadFileEndpoint = async reqData => {
  const data = validate(reqData.data, sysReadFileJoiSchema);
  await kUtilsInjectables.session().getAgentFromReqInterServer(reqData);

  const mount = await getSysOpMount(data);
  const backend = FimidaraFilePersistenceProvider.getBackend(
    kFimidaraConfigFilePersistenceProvider.fs
  );

  const persistedFile = await backend.readFile({
    filepath: stringifyFilenamepath({
      namepath: data.namepath,
      ext: data.ext,
    }),
    workspaceId: data.workspaceId,
    fileId: data.fileId,
    mount,
    part: data.part,
    clientMultipartId: data.multipartId,
  });

  return {
    stream: persistedFile.body || Readable.from([]),
    contentLength: persistedFile.size,
  };
};

export default sysReadFile;
