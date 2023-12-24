import {container} from 'tsyringe';
import {FileBackendMount} from '../../../definitions/fileBackend';
import {Agent, kAppResourceType} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {newWorkspaceResource} from '../../../utils/resource';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {kInjectionKeys} from '../../contexts/injection';
import {SemanticFileBackendConfigProvider} from '../../contexts/semantic/fileBackendConfig/types';
import {
  SemanticFileBackendMountProvider,
  SemanticProviderMutationRunOptions,
} from '../../contexts/semantic/types';
import {kFolderConstants} from '../../folders/constants';
import {ensureFolders, getFolderpathInfo} from '../../folders/utils';
import {NewFileBackendMountInput} from './types';

export const INTERNAL_addFileBackendMount = async (
  agent: Agent,
  workspace: Workspace,
  data: NewFileBackendMountInput,
  opts: SemanticProviderMutationRunOptions
) => {
  const fileBackendMountModel = container.resolve<SemanticFileBackendMountProvider>(
    kInjectionKeys.semantic.fileBackendMount
  );
  const fileBackendConfigModel = container.resolve<SemanticFileBackendConfigProvider>(
    kInjectionKeys.semantic.fileBackendConfig
  );

  const folderpathinfo = getFolderpathInfo(data.folderpath);
  appAssert(
    workspace.rootname === folderpathinfo.rootname,
    kReuseableErrors.workspace.rootnameDoesNotMatchFolderRootname(
      workspace.rootname,
      folderpathinfo.rootname
    )
  );

  const mountedFromSplit = data.mountedFrom.split(kFolderConstants.separator);
  const mountExists = await fileBackendMountModel.existsByQuery(
    {
      backend: data.backend,
      workspaceId: workspace.resourceId,
      folderpath: {$all: folderpathinfo.namepath, $size: folderpathinfo.namepath.length},
      mountedFrom: {$all: mountedFromSplit, $size: mountedFromSplit.length},
    },
    opts
  );

  if (mountExists) {
    throw kReuseableErrors.mount.exactMountConfigExists(
      data.mountedFrom,
      data.folderpath,
      data.backend
    );
  }

  const backendConfig = await fileBackendConfigModel.getOneByQuery(
    {workspaceId: workspace.resourceId, resourceId: data.configId},
    opts
  );

  if (!backendConfig) {
    throw kReuseableErrors.config.notFound();
  }

  if (backendConfig.backend !== data.backend) {
    throw kReuseableErrors.mount.configMountBackendMismatch(
      backendConfig.backend,
      data.backend
    );
  }

  const mount = newWorkspaceResource<FileBackendMount>(
    agent,
    kAppResourceType.FileBackendMount,
    workspace.resourceId,
    {
      configId: data.configId,
      folderpath: folderpathinfo.namepath,
      index: data.index,
      mountedFrom: mountedFromSplit,
      backend: data.backend,
      name: data.name,
      description: data.description,
    }
  );

  await Promise.all([
    ensureFolders(agent, workspace, data.folderpath, opts),
    fileBackendMountModel.insertItem(mount, opts),
  ]);

  return mount;
};
