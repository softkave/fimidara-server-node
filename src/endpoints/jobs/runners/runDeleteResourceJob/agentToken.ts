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
  [kAppResourceType.FileBackendMount]: null,
  [kAppResourceType.FileBackendConfig]: null,
  [kAppResourceType.Job]: null,
  [kAppResourceType.AssignedItem]: null,
  [kAppResourceType.ResolvedMountEntry]: null,
  [kAppResourceType.PermissionItem]: getResourcePermissionItemArtifacts,
  [kAppResourceType.FilePresignedPath]: async ({args, opts}) => {
    const token = await kSemanticModels.agentToken().getOneById(args.resourceId);

    if (token) {
      return await kSemanticModels
        .filePresignedPath()
        .getManyByQuery({issueAgentTokenId: token.resourceId}, opts);
    }

    return [];
  },
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
  [kAppResourceType.FileBackendMount]: null,
  [kAppResourceType.FileBackendConfig]: null,
  [kAppResourceType.Job]: null,
  [kAppResourceType.PermissionItem]: null,
  [kAppResourceType.ResolvedMountEntry]: null,
  [kAppResourceType.FilePresignedPath]: async ({args, helpers}) => {
    const token = await kSemanticModels.agentToken().getOneById(args.resourceId);

    if (token) {
      await helpers.withTxn(opts =>
        kSemanticModels
          .filePresignedPath()
          .getManyByQuery({issueAgentTokenId: token.resourceId}, opts)
      );
    }
  },
  [kAppResourceType.AssignedItem]: deleteResourceAssignedItemArtifacts,
};

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels.agentToken().deleteOneById(args.resourceId, opts)
  );

export const deleteAgentTokenCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getComplexArtifacts,
  deleteSimpleArtifacts,
};
