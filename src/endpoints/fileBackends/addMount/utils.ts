import {container} from 'tsyringe';
import {FileBackendMount} from '../../../definitions/fileBackend';
import {Agent, AppResourceTypeMap} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {newWorkspaceResource} from '../../../utils/resource';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {kInjectionKeys} from '../../contexts/injection';
import {SemanticFileBackendConfigProvider} from '../../contexts/semantic/fileBackendConfig/types';
import {
  SemanticFileBackendMountProvider,
  SemanticProviderMutationRunOptions,
} from '../../contexts/semantic/types';
import {ResourceExistsError} from '../../errors';
import {ensureFolders, stringifyFoldernamepath} from '../../folders/utils';
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

  const mountExists = await fileBackendMountModel.existsByQuery(
    {
      backend: data.backend,
      folderpath: {$all: data.folderpath, $size: data.folderpath.length},
      mountedFrom: {$all: data.mountedFrom, $size: data.mountedFrom.length},
    },
    opts
  );

  if (mountExists) {
    throw new ResourceExistsError(
      `Mount exists from ${data.mountedFrom.join('/')} to ${data.folderpath.join('/')}`
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
    AppResourceTypeMap.FileBackendMount,
    workspace.resourceId,
    {
      configId: data.configId,
      folderpath: data.folderpath,
      index: data.index,
      mountedFrom: data.mountedFrom,
      backend: data.backend,
      name: data.name,
      description: data.description,
    }
  );

  await Promise.all([
    ensureFolders(
      agent,
      workspace,
      stringifyFoldernamepath({namepath: data.folderpath}, workspace.rootname),
      opts
    ),
    fileBackendMountModel.insertItem(mount, opts),
  ]);

  return mount;
};
