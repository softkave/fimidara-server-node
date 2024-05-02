import {App} from '../../../definitions/app.js';
import {FileBackendConfig, FileBackendMount} from '../../../definitions/fileBackend.js';
import {PermissionGroup} from '../../../definitions/permissionGroups.js';
import {AppRuntimeState} from '../../../definitions/system.js';
import {Tag} from '../../../definitions/tag.js';
import {UsageRecord} from '../../../definitions/usageRecord.js';
import {DataSemanticBaseProvider} from './DataSemanticDataAccessBaseProvider.js';
import {DataSemanticWorkspaceResourceProvider} from './DataSemanticDataAccessWorkspaceResourceProvider.js';
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
  extends DataSemanticWorkspaceResourceProvider<FileBackendMount>
  implements SemanticFileBackendMountProvider {}

export class DataSemanticApp
  extends DataSemanticWorkspaceResourceProvider<App>
  implements SemanticAppProvider {}

export class DataSemanticTag
  extends DataSemanticWorkspaceResourceProvider<Tag>
  implements SemanticTagProviderType {}

export class DataSemanticUsageRecord
  extends DataSemanticWorkspaceResourceProvider<UsageRecord>
  implements SemanticUsageRecordProviderType {}

export class DataSemanticPermissionGroup
  extends DataSemanticWorkspaceResourceProvider<PermissionGroup>
  implements SemanticPermissionGroupProviderType {}

export class DataSemanticFileBackendConfig
  extends DataSemanticWorkspaceResourceProvider<FileBackendConfig>
  implements SemanticFileBackendConfigProvider {}

export class DataSemanticAppRuntimeState
  extends DataSemanticBaseProvider<AppRuntimeState>
  implements SemanticAppRuntimeStateProvider {}
