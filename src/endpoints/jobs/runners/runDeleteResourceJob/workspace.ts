import {kAppResourceType} from '../../../../definitions/system';
import {kSemanticModels} from '../../../contexts/injectables';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceDeleteSimpleArtifactsFns,
  DeleteResourceFn,
  DeleteResourceGetComplexArtifactsFns,
} from './types';

const getComplexArtifacts: DeleteResourceGetComplexArtifactsFns = {
  [kAppResourceType.All]: null,
  [kAppResourceType.System]: null,
  [kAppResourceType.Public]: null,
  [kAppResourceType.User]: null,
  [kAppResourceType.EndpointRequest]: null,
  [kAppResourceType.App]: null,
  [kAppResourceType.Job]: null,
  [kAppResourceType.Workspace]: ({args, opts}) =>
    kSemanticModels.workspace().getManyByWorkspaceId(args.workspaceId, opts),
  [kAppResourceType.CollaborationRequest]: ({args, opts}) =>
    kSemanticModels.collaborationRequest().getManyByWorkspaceId(args.workspaceId, opts),
  [kAppResourceType.AgentToken]: ({args, opts}) =>
    kSemanticModels.agentToken().getManyByWorkspaceId(args.workspaceId, opts),
  [kAppResourceType.PermissionGroup]: ({args, opts}) =>
    kSemanticModels.permissionGroup().getManyByWorkspaceId(args.workspaceId, opts),
  [kAppResourceType.PermissionItem]: ({args, opts}) =>
    kSemanticModels.permissionItem().getManyByWorkspaceId(args.workspaceId, opts),
  [kAppResourceType.Folder]: ({args, opts}) =>
    kSemanticModels.folder().getManyByWorkspaceId(args.workspaceId, opts),
  [kAppResourceType.File]: ({args, opts}) =>
    kSemanticModels.file().getManyByWorkspaceId(args.workspaceId, opts),
  [kAppResourceType.Tag]: ({args, opts}) =>
    kSemanticModels.tag().getManyByWorkspaceId(args.workspaceId, opts),
  [kAppResourceType.AssignedItem]: ({args, opts}) =>
    kSemanticModels.assignedItem().getManyByWorkspaceId(args.workspaceId, opts),
  [kAppResourceType.UsageRecord]: ({args, opts}) =>
    kSemanticModels.usageRecord().getManyByWorkspaceId(args.workspaceId, opts),
  [kAppResourceType.FilePresignedPath]: ({args, opts}) =>
    kSemanticModels.filePresignedPath().getManyByWorkspaceId(args.workspaceId, opts),
  [kAppResourceType.FileBackendMount]: ({args, opts}) =>
    kSemanticModels.fileBackendMount().getManyByWorkspaceId(args.workspaceId, opts),
  [kAppResourceType.FileBackendConfig]: ({args, opts}) =>
    kSemanticModels.fileBackendConfig().getManyByWorkspaceId(args.workspaceId, opts),
  [kAppResourceType.ResolvedMountEntry]: ({args, opts}) =>
    kSemanticModels.resolvedMountEntry().getManyByWorkspaceId(args.workspaceId, opts),
};

const deleteSimpleArtifacts: DeleteResourceDeleteSimpleArtifactsFns = {
  [kAppResourceType.All]: null,
  [kAppResourceType.System]: null,
  [kAppResourceType.Public]: null,
  [kAppResourceType.User]: null,
  [kAppResourceType.EndpointRequest]: null,
  [kAppResourceType.App]: null,
  [kAppResourceType.Job]: null,
  [kAppResourceType.Workspace]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels.workspace().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.CollaborationRequest]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .collaborationRequest()
        .deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.AgentToken]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels.agentToken().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.PermissionGroup]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels.permissionGroup().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.PermissionItem]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels.permissionItem().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.Folder]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels.folder().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.File]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels.file().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.Tag]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels.tag().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.AssignedItem]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels.assignedItem().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.UsageRecord]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels.usageRecord().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.FilePresignedPath]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels.filePresignedPath().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.FileBackendMount]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels.fileBackendMount().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.FileBackendConfig]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels.fileBackendConfig().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
  [kAppResourceType.ResolvedMountEntry]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels.resolvedMountEntry().deleteManyByWorkspaceId(args.workspaceId, opts)
    ),
};

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels.workspace().deleteOneById(args.resourceId, opts)
  );

export const deleteWorkspaceCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getComplexArtifacts,
  deleteSimpleArtifacts,
};
