import {kAppResourceType} from '../../../../definitions/system';
import {kSemanticModels} from '../../../contexts/injection/injectables';
import {genericGetArtifacts} from './genericDefinitions';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceDeleteArtifactsFns,
  DeleteResourceFn,
  DeleteResourceGetArtifactsFns,
} from './types';

const getArtifacts: DeleteResourceGetArtifactsFns = {
  ...genericGetArtifacts,
  // Delete file and folders in external storage
  [kAppResourceType.Folder]: ({args, opts}) =>
    kSemanticModels.folder().getManyByWorkspaceId(args.workspaceId, opts),
  [kAppResourceType.File]: ({args, opts}) =>
    kSemanticModels.file().getManyByWorkspaceId(args.workspaceId, opts),
  // Delete config secrets in secrets store
  [kAppResourceType.FileBackendConfig]: ({args, opts}) =>
    kSemanticModels.fileBackendConfig().getManyByWorkspaceId(args.workspaceId, opts),
  [kAppResourceType.PermissionItem]: ({args, opts}) =>
    kSemanticModels.permissionItem().getManyByWorkspaceId(args.workspaceId, opts),
};

const deleteArtifacts: DeleteResourceDeleteArtifactsFns = {
  [kAppResourceType.All]: null,
  [kAppResourceType.System]: null,
  [kAppResourceType.Public]: null,
  [kAppResourceType.User]: null,
  [kAppResourceType.EndpointRequest]: null,
  [kAppResourceType.App]: null,
  [kAppResourceType.Job]: null,
  [kAppResourceType.Workspace]: null,
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
  [kAppResourceType.PresignedPath]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels.presignedPath().deleteManyByWorkspaceId(args.workspaceId, opts)
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
  getArtifacts: getArtifacts,
  deleteArtifacts: deleteArtifacts,
};
