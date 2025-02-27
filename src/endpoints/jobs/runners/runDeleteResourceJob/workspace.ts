import {kSemanticModels} from '../../../../contexts/injection/injectables.js';
import {kFimidaraResourceType} from '../../../../definitions/system.js';
import {
  genericGetArtifacts,
  noopGetPreRunMetaFn,
} from './genericDefinitions.js';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceDeleteArtifactsFns,
  DeleteResourceFn,
  DeleteResourceGetArtifactsToDeleteFns,
} from './types.js';

const getArtifacts: DeleteResourceGetArtifactsToDeleteFns = {
  ...genericGetArtifacts,
  // Delete file and folders in external storage
  [kFimidaraResourceType.Folder]: ({args, opts}) =>
    kSemanticModels.folder().getManyByWorkspaceId(args.workspaceId, opts),
  [kFimidaraResourceType.File]: ({args, opts}) =>
    kSemanticModels.file().getManyByWorkspaceId(args.workspaceId, opts),
  // Delete config secrets in secrets store
  [kFimidaraResourceType.FileBackendConfig]: ({args, opts}) =>
    kSemanticModels
      .fileBackendConfig()
      .getManyByWorkspaceId(args.workspaceId, opts),
  [kFimidaraResourceType.PermissionItem]: ({args, opts}) =>
    kSemanticModels
      .permissionItem()
      .getManyByWorkspaceId(args.workspaceId, opts),
};

const deleteArtifacts: DeleteResourceDeleteArtifactsFns = {
  [kFimidaraResourceType.All]: null,
  [kFimidaraResourceType.System]: null,
  [kFimidaraResourceType.Public]: null,
  [kFimidaraResourceType.User]: null,
  [kFimidaraResourceType.EndpointRequest]: null,
  [kFimidaraResourceType.App]: null,
  [kFimidaraResourceType.Job]: null,
  [kFimidaraResourceType.Workspace]: null,
  [kFimidaraResourceType.emailBlocklist]: null,
  [kFimidaraResourceType.appShard]: null,
  [kFimidaraResourceType.script]: null,
  [kFimidaraResourceType.emailMessage]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .emailMessage()
        .deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kFimidaraResourceType.CollaborationRequest]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .collaborationRequest()
        .deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kFimidaraResourceType.AgentToken]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .agentToken()
        .deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kFimidaraResourceType.PermissionGroup]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .permissionGroup()
        .deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kFimidaraResourceType.PermissionItem]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .permissionItem()
        .deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kFimidaraResourceType.Folder]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels.folder().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kFimidaraResourceType.File]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels.file().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kFimidaraResourceType.Tag]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels.tag().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kFimidaraResourceType.AssignedItem]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .assignedItem()
        .deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kFimidaraResourceType.UsageRecord]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .usageRecord()
        .deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kFimidaraResourceType.PresignedPath]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .presignedPath()
        .deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kFimidaraResourceType.FileBackendMount]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .fileBackendMount()
        .deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kFimidaraResourceType.FileBackendConfig]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .fileBackendConfig()
        .deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kFimidaraResourceType.ResolvedMountEntry]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .resolvedMountEntry()
        .deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kFimidaraResourceType.jobHistory]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .jobHistory()
        .deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
};

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels.workspace().deleteOneById(args.resourceId, opts)
  );

export const deleteWorkspaceCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getArtifactsToDelete: getArtifacts,
  deleteArtifacts: deleteArtifacts,
  getPreRunMetaFn: noopGetPreRunMetaFn,
};
