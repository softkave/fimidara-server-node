import {FileBackendMount, kFileBackendType} from '../../../definitions/fileBackend';
import {Agent, kAppResourceType} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {pathSplit} from '../../../utils/fns';
import {newWorkspaceResource} from '../../../utils/resource';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {ensureFolders, getFolderpathInfo} from '../../folders/utils';
import {mountExists, mountNameExists} from '../utils';
import {NewFileBackendMountInput} from './types';

export const INTERNAL_addFileBackendMount = async (
  agent: Agent,
  workspace: Workspace,
  data: NewFileBackendMountInput,
  opts: SemanticProviderMutationRunOptions
) => {
  const fileBackendMountModel = kSemanticModels.fileBackendMount();
  const fileBackendConfigModel = kSemanticModels.fileBackendConfig();

  const folderpathinfo = getFolderpathInfo(data.folderpath, {allowRootFolder: true});
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
    kAppResourceType.FileBackendMount,
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
    ensureFolders(agent, workspace, folderpathinfo.namepath, opts),
    fileBackendMountModel.insertItem(mount, opts),
  ]);

  return mount;
};
