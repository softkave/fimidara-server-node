import {FimidaraFilePersistenceProvider} from '../../../contexts/file/FimidaraFilePersistenceProvider.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {kFimidaraConfigFilePersistenceProvider} from '../../../resources/config.js';
import {validate} from '../../../utils/validate.js';
import {stringifyFilenamepath} from '../../files/utils.js';
import {getSysOpMount} from '../utils/getSysOpMount.js';
import {SysDeleteFileEndpoint} from './types.js';
import {sysDeleteFileJoiSchema} from './validation.js';

const sysDeleteFile: SysDeleteFileEndpoint = async reqData => {
  const data = validate(reqData.data, sysDeleteFileJoiSchema);
  await kUtilsInjectables.session().getAgentFromReqInterServer(reqData);

  const mount = await getSysOpMount(data);
  const backend = FimidaraFilePersistenceProvider.getBackend(
    kFimidaraConfigFilePersistenceProvider.fs
  );

  const filepath = stringifyFilenamepath({
    namepath: data.namepath,
    ext: data.ext,
  });

  if (data.part && data.multipartId) {
    await backend.deleteMultipartUploadPart({
      fileId: data.fileId,
      multipartId: data.multipartId,
      part: data.part,
      mount,
      filepath,
      workspaceId: data.workspaceId,
    });
  } else if (data.multipartId) {
    await backend.cleanupMultipartUpload({
      filepath,
      fileId: data.fileId,
      multipartId: data.multipartId,
      mount,
      workspaceId: data.workspaceId,
    });
  } else {
    await backend.deleteFiles({
      files: [
        {
          fileId: data.fileId,
          filepath,
        },
      ],
      workspaceId: data.workspaceId,
      mount,
    });
  }
};

export default sysDeleteFile;
