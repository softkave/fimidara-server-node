import {kAppResourceType} from '../../../../definitions/system';
import {kSemanticModels} from '../../../contexts/injection/injectables';
import {resolveBackendsMountsAndConfigs} from '../../../fileBackends/mountUtils';
import {FileQueries} from '../../../files/queries';
import {kFolderConstants} from '../../../folders/constants';
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
    const file = await kSemanticModels.file().getOneById(args.resourceId);

    if (file) {
      return await kSemanticModels
        .filePresignedPath()
        .getManyByQuery(FileQueries.getByNamepath(file), opts);
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
  [kAppResourceType.FilePresignedPath]: null,
  [kAppResourceType.FileBackendMount]: null,
  [kAppResourceType.FileBackendConfig]: null,
  [kAppResourceType.Job]: null,
  [kAppResourceType.PermissionItem]: null,
  [kAppResourceType.AssignedItem]: deleteResourceAssignedItemArtifacts,
  [kAppResourceType.ResolvedMountEntry]: async ({args, helpers}) =>
    helpers.withTxn(async opts => {
      const file = await kSemanticModels.file().getOneById(args.resourceId);

      if (file) {
        await kSemanticModels
          .resolvedMountEntry()
          .deleteManyByQuery(FileQueries.getByNamepath(file), opts);
      }
    }),
  other: async ({args}) => {
    const file = await kSemanticModels.file().getOneById(args.resourceId);

    if (file) {
      const filepath = file.namepath.join(kFolderConstants.separator);
      const {providersMap, mounts} = await resolveBackendsMountsAndConfigs(file);
      await Promise.all(
        mounts.map(async mount => {
          try {
            const provider = providersMap[mount.resourceId];
            // TODO: if we're deleting the parent folder, for jobs created from a
            // parent folder, do we still need to delete the file, for backends
            // that support deleting folders?
            await provider.deleteFiles({
              mount,
              filepaths: [filepath],
              workspaceId: file.workspaceId,
            });
          } catch (error) {
            console.error(error);
          }
        })
      );
    }
  },
};

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts => kSemanticModels.file().deleteOneById(args.resourceId, opts));

export const deleteFileCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getComplexArtifacts,
  deleteSimpleArtifacts,
};
