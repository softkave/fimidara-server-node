import {kAppResourceType} from '../../../../definitions/system';
import {kSemanticModels} from '../../../contexts/injection/injectables';
import {genericDeleteArtifacts, genericGetArtifacts} from './genericEntries';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceDeleteArtifactsFns,
  DeleteResourceFn,
  DeleteResourceGetArtifactsFns,
} from './types';

const getArtifacts: DeleteResourceGetArtifactsFns = {
  ...genericGetArtifacts,
  [kAppResourceType.FilePresignedPath]: async ({args, opts}) => {
    return await kSemanticModels
      .filePresignedPath()
      .getManyByQuery({issuerAgentTokenId: args.resourceId}, opts);
  },
};

const deleteArtifacts: DeleteResourceDeleteArtifactsFns = {
  ...genericDeleteArtifacts,
  [kAppResourceType.FilePresignedPath]: async ({args, helpers}) => {
    await helpers.withTxn(opts =>
      kSemanticModels
        .filePresignedPath()
        .deleteManyByQuery({issuerAgentTokenId: args.resourceId}, opts)
    );
  },
};

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kSemanticModels.agentToken().deleteOneById(args.resourceId, opts)
  );

export const deleteAgentTokenCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getArtifacts: getArtifacts,
  deleteArtifacts: deleteArtifacts,
};
