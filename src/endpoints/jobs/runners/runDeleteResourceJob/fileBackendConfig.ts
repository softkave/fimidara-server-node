import {kAppResourceType} from '../../../../definitions/system';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
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
  [kAppResourceType.ResolvedMountEntry]: null,
  [kAppResourceType.Job]: null,
  [kAppResourceType.PermissionItem]: null,
  [kAppResourceType.AssignedItem]: deleteResourceAssignedItemArtifacts,
  other: async ({args}) => {
    const config = await kSemanticModels.fileBackendConfig().getOneById(args.resourceId);

    if (config?.secretId) {
      await kUtilsInjectables.secretsManager().deleteSecret({secretId: config.secretId});
    }
  },
};

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels.fileBackendConfig().deleteOneById(args.resourceId, opts)
  );

export const deleteFileBackendConfigCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getComplexArtifacts,
  deleteSimpleArtifacts,
};
