import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {
  FileBackendMount,
  kFileBackendType,
} from '../../../definitions/fileBackend.js';
import {
  SessionAgent,
  kFimidaraResourceType,
} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {appAssert} from '../../../utils/assertion.js';
import {pathSplit} from '../../../utils/fns.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {ensureFolders, getFolderpathInfo} from '../../folders/utils.js';
import {assertRootname} from '../../workspaces/utils.js';
import {mountExists, mountNameExists} from '../utils.js';
import {NewFileBackendMountInput} from './types.js';

export const INTERNAL_addFileBackendMount = async (
  agent: SessionAgent,
  workspace: Workspace,
  data: NewFileBackendMountInput,
  opts: SemanticProviderMutationParams
) => {
  const fileBackendMountModel = kIjxSemantic.fileBackendMount();
  const fileBackendConfigModel = kIjxSemantic.fileBackendConfig();

  const folderpathinfo = getFolderpathInfo(data.folderpath, {
    allowRootFolder: true,
    containsRootname: true,
  });
  assertRootname(folderpathinfo.rootname);
  appAssert(
    workspace.rootname === folderpathinfo.rootname,
    kReuseableErrors.workspace.rootnameDoesNotMatchFolderRootname(
      workspace.rootname,
      folderpathinfo.rootname
    )
  );

  let exists = await mountNameExists(
    {workspaceId: workspace.resourceId, name: data.name},
    opts
  );

  if (exists) {
    throw kReuseableErrors.mount.mountExists();
  }

  const mountedFromSplit = pathSplit(data.mountedFrom);
  exists = await mountExists(
    {
      backend: data.backend,
      workspaceId: workspace.resourceId,
      namepath: folderpathinfo.namepath,
      mountedFrom: mountedFromSplit,
    },
    opts
  );

  if (exists) {
    throw kReuseableErrors.mount.exactMountConfigExists(
      data.mountedFrom,
      data.folderpath,
      data.backend
    );
  }

  if (data.backend !== kFileBackendType.fimidara) {
    const backendConfig = await fileBackendConfigModel.getOneByQuery(
      {workspaceId: workspace.resourceId, resourceId: data.configId},
      opts
    );
    appAssert(backendConfig, kReuseableErrors.config.notFound());
    appAssert(
      backendConfig.backend === data.backend,
      kReuseableErrors.mount.configMountBackendMismatch(
        backendConfig.backend,
        data.backend
      )
    );
  }

  const mount = newWorkspaceResource<FileBackendMount>(
    agent,
    kFimidaraResourceType.FileBackendMount,
    workspace.resourceId,
    {
      configId: data.configId,
      namepath: folderpathinfo.namepath,
      index: data.index,
      mountedFrom: mountedFromSplit,
      backend: data.backend,
      name: data.name,
      description: data.description,
    }
  );

  await Promise.all([
    ensureFolders(agent, workspace, folderpathinfo.namepath),
    fileBackendMountModel.insertItem(mount, opts),
  ]);

  return mount;
};
