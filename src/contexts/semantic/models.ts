import {App} from '../../definitions/app.js';
import {
  FileBackendConfig,
  FileBackendMount,
} from '../../definitions/fileBackend.js';
import {PermissionGroup} from '../../definitions/permissionGroups.js';
import {AppRuntimeState} from '../../definitions/system.js';
import {Tag} from '../../definitions/tag.js';
import {UsageRecord} from '../../definitions/usageRecord.js';
import {SemanticBaseProvider} from './SemanticBaseProvider.js';
import {SemanticWorkspaceResourceProvider} from './SemanticWorkspaceResourceProvider.js';
import {
  SemanticAppProvider,
  SemanticAppRuntimeStateProvider,
  SemanticFileBackendConfigProvider,
  SemanticFileBackendMountProvider,
  SemanticPermissionGroupProviderType,
  SemanticTagProviderType,
  SemanticUsageRecordProviderType,
} from './types.js';

export class DataSemanticFileBackendMount
  extends SemanticWorkspaceResourceProvider<FileBackendMount>
  implements SemanticFileBackendMountProvider {}

export class DataSemanticApp
  extends SemanticWorkspaceResourceProvider<App>
  implements SemanticAppProvider {}

export class DataSemanticTag
  extends SemanticWorkspaceResourceProvider<Tag>
  implements SemanticTagProviderType {}

export class DataSemanticUsageRecord
  extends SemanticWorkspaceResourceProvider<UsageRecord>
  implements SemanticUsageRecordProviderType {}

export class DataSemanticPermissionGroup
  extends SemanticWorkspaceResourceProvider<PermissionGroup>
  implements SemanticPermissionGroupProviderType {}

export class DataSemanticFileBackendConfig
  extends SemanticWorkspaceResourceProvider<FileBackendConfig>
  implements SemanticFileBackendConfigProvider {}

export class DataSemanticAppRuntimeState
  extends SemanticBaseProvider<AppRuntimeState>
  implements SemanticAppRuntimeStateProvider {}
