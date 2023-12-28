import {kAppResourceType} from '../../../../definitions/system';
import {kSemanticModels} from '../../../contexts/injectables';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceDeleteSimpleArtifactsFns,
  DeleteResourceFn,
  DeleteResourceGetComplexArtifactsFns,
} from './types';
import {
  deleteResourceAssignedItemArtifacts,
  getResourcePermissionItemArtifacts,
} from './utils';

const getComplexArtifacts: DeleteResourceGetComplexArtifactsFns = {
  [kAppResourceType.All]: null,
  [kAppResourceType.System]: null,
  [kAppResourceType.Public]: null,
  [kAppResourceType.User]: null,
  [kAppResourceType.EndpointRequest]: null,
  [kAppResourceType.App]: null,
  [kAppResourceType.Workspace]: null,
  [kAppResourceType.CollaborationRequest]: null,
  [kAppResourceType.AgentToken]: null,
  [kAppResourceType.PermissionGroup]: null,
  [kAppResourceType.Folder]: null,
  [kAppResourceType.File]: null,
  [kAppResourceType.Tag]: null,
  [kAppResourceType.UsageRecord]: null,
  [kAppResourceType.FilePresignedPath]: null,
  [kAppResourceType.FileBackendMount]: null,
  [kAppResourceType.FileBackendConfig]: null,
  [kAppResourceType.ResolvedMountEntry]: null,
  [kAppResourceType.Job]: null,
  [kAppResourceType.AssignedItem]: null,
  [kAppResourceType.PermissionItem]: getResourcePermissionItemArtifacts,
};

const deleteSimpleArtifacts: DeleteResourceDeleteSimpleArtifactsFns = {
  [kAppResourceType.All]: null,
  [kAppResourceType.System]: null,
  [kAppResourceType.Public]: null,
  [kAppResourceType.User]: null,
  [kAppResourceType.EndpointRequest]: null,
  [kAppResourceType.App]: null,
  [kAppResourceType.Workspace]: null,
  [kAppResourceType.CollaborationRequest]: null,
  [kAppResourceType.AgentToken]: null,
  [kAppResourceType.PermissionGroup]: null,
  [kAppResourceType.Folder]: null,
  [kAppResourceType.File]: null,
  [kAppResourceType.Tag]: null,
  [kAppResourceType.UsageRecord]: null,
  [kAppResourceType.FilePresignedPath]: null,
  [kAppResourceType.FileBackendMount]: null,
  [kAppResourceType.FileBackendConfig]: null,
  // TODO: should we delete the jobs too?
  [kAppResourceType.Job]: null,
  [kAppResourceType.PermissionItem]: null,
  [kAppResourceType.AssignedItem]: deleteResourceAssignedItemArtifacts,
  [kAppResourceType.ResolvedMountEntry]: ({args, helpers}) =>
    helpers.withTxn(opts =>
      kSemanticModels
        .resolvedMountEntry()
        .deleteManyByQuery({mountId: args.resourceId}, opts)
    ),
};

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels.fileBackendMount().deleteOneById(args.resourceId, opts)
  );

export const deleteFileBackendMountCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getComplexArtifacts,
  deleteSimpleArtifacts,
};
