import {container} from 'tsyringe';
import {FimidaraConfig} from '../../resources/types';
import {SessionContextType} from './SessionContext';
import {AsyncLocalStorageUtils} from './asyncLocalStorage';
import {SecretsManagerProvider} from './encryption/types';
import {FileProviderResolver} from './file/types';
import {kInjectionKeys} from './injection';
import {SemanticAgentTokenProvider} from './semantic/agentToken/types';
import {SemanticAssignedItemProvider} from './semantic/assignedItem/types';
import {
  SemanticFilePresignedPathProvider,
  SemanticFileProvider,
} from './semantic/file/types';
import {SemanticFileBackendConfigProvider} from './semantic/fileBackendConfig/types';
import {SemanticFolderProvider} from './semantic/folder/types';
import {SemanticPermissionProviderType} from './semantic/permission/types';
import {SemanticPermissionGroupProviderType} from './semantic/permissionGroup/types';
import {SemanticPermissionItemProviderType} from './semantic/permissionItem/types';
import {SemanticTagProviderType} from './semantic/tag/types';
import {
  SemanticFileBackendMountProvider,
  SemanticJobProvider,
  SemanticProviderUtils,
} from './semantic/types';
import {SemanticUserProviderType} from './semantic/user/types';
import {SemanticWorkspaceProviderType} from './semantic/workspace/types';

export const kSemanticModels = {
  user: () => container.resolve<SemanticUserProviderType>(kInjectionKeys.semantic.user),
  file: () => container.resolve<SemanticFileProvider>(kInjectionKeys.semantic.file),
  agentToken: () =>
    container.resolve<SemanticAgentTokenProvider>(kInjectionKeys.semantic.file),
  folder: () => container.resolve<SemanticFolderProvider>(kInjectionKeys.semantic.folder),
  workspace: () =>
    container.resolve<SemanticWorkspaceProviderType>(kInjectionKeys.semantic.workspace),
  fileBackendConfig: () =>
    container.resolve<SemanticFileBackendConfigProvider>(
      kInjectionKeys.semantic.fileBackendConfig
    ),
  fileBackendMount: () =>
    container.resolve<SemanticFileBackendMountProvider>(
      kInjectionKeys.semantic.fileBackendMount
    ),
  filePresignedPath: () =>
    container.resolve<SemanticFilePresignedPathProvider>(
      kInjectionKeys.semantic.filePresignedPath
    ),
  permissions: () =>
    container.resolve<SemanticPermissionProviderType>(
      kInjectionKeys.semantic.permissions
    ),
  permissionGroups: () =>
    container.resolve<SemanticPermissionGroupProviderType>(
      kInjectionKeys.semantic.permissionGroups
    ),
  permissionItems: () =>
    container.resolve<SemanticPermissionItemProviderType>(
      kInjectionKeys.semantic.permissionItems
    ),
  tags: () => container.resolve<SemanticTagProviderType>(kInjectionKeys.semantic.tags),
  assignedItems: () =>
    container.resolve<SemanticAssignedItemProvider>(
      kInjectionKeys.semantic.assignedItems
    ),
  jobs: () => container.resolve<SemanticJobProvider>(kInjectionKeys.semantic.jobs),
  utils: () => container.resolve<SemanticProviderUtils>(kInjectionKeys.semantic.utils),
};

export const kUtilsInjectables = {
  config: () => container.resolve<FimidaraConfig>(kInjectionKeys.config),
  secretsManager: () =>
    container.resolve<SecretsManagerProvider>(kInjectionKeys.secretsManager),
  fileProviderResolver: () =>
    container.resolve<FileProviderResolver>(kInjectionKeys.fileProviderResolver),
  asyncLocalStorage: () =>
    container.resolve<AsyncLocalStorageUtils>(kInjectionKeys.asyncLocalStorage),
  session: () => container.resolve<SessionContextType>(kInjectionKeys.session),
};
