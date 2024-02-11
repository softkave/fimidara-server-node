import {kAppResourceType} from '../../../../definitions/system';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {resolveBackendsMountsAndConfigs} from '../../../fileBackends/mountUtils';
import {FileQueries} from '../../../files/queries';
import {stringifyFilenamepath} from '../../../files/utils';
import {genericDeleteArtifacts, genericGetArtifacts} from './genericDefinitions';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceDeleteArtifactsFns,
  DeleteResourceFn,
  DeleteResourceGetArtifactsFns,
} from './types';

const getArtifacts: DeleteResourceGetArtifactsFns = {
  ...genericGetArtifacts,
  [kAppResourceType.PresignedPath]: async ({args, opts}) => {
    const file = await kSemanticModels.file().getOneById(args.resourceId);

    if (file) {
      return await kSemanticModels
        .presignedPath()
        .getManyByQuery(FileQueries.getByNamepath(file), opts);
    }

    return [];
  },
};

const deleteArtifacts: DeleteResourceDeleteArtifactsFns = {
  ...genericDeleteArtifacts,
  [kAppResourceType.ResolvedMountEntry]: async ({args, helpers}) =>
    helpers.withTxn(async opts => {
      const file = await kSemanticModels.file().getOneById(args.resourceId);

      if (file) {
        await kSemanticModels
          .resolvedMountEntry()
          .deleteManyByQuery(FileQueries.getByNamepath(file), opts);
      }
    }),
};

const deleteResourceFn: DeleteResourceFn = async ({args, helpers}) => {
  const file = await kSemanticModels.file().getOneById(args.resourceId);

  if (!file) {
    return;
  }

  const filepath = stringifyFilenamepath(file);
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
        kUtilsInjectables.logger().error(error);
      }
    })
  );

  await helpers.withTxn(opts => {
    kSemanticModels.file().deleteOneById(args.resourceId, opts);
  });
};

export const deleteFileCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getArtifacts: getArtifacts,
  deleteArtifacts: deleteArtifacts,
};
