import {App} from '../../../definitions/app';
import {FileBackendConfig, FileBackendMount} from '../../../definitions/fileBackend';
import {PermissionGroup} from '../../../definitions/permissionGroups';
import {AppRuntimeState} from '../../../definitions/system';
import {Tag} from '../../../definitions/tag';
import {UsageRecord} from '../../../definitions/usageRecord';
import {DataSemanticBaseProvider} from './DataSemanticDataAccessBaseProvider';
import {DataSemanticWorkspaceResourceProvider} from './DataSemanticDataAccessWorkspaceResourceProvider';
import {
  SemanticAppProvider,
  SemanticAppRuntimeStateProvider,
  SemanticFileBackendConfigProvider,
  SemanticFileBackendMountProvider,
  SemanticPermissionGroupProviderType,
  SemanticTagProviderType,
  SemanticUsageRecordProviderType,
} from './types';

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
