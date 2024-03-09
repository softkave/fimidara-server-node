import {kFimidaraResourceType} from '../../../../definitions/system';
import {kSemanticModels} from '../../../contexts/injection/injectables';
import {genericDeleteArtifacts, genericGetArtifacts} from './genericDefinitions';
import {
  DeleteResourceCascadeEntry,
  DeleteResourceDeleteArtifactsFns,
  DeleteResourceFn,
  DeleteResourceGetArtifactsFns,
} from './types';

const getArtifacts: DeleteResourceGetArtifactsFns = {
  ...genericGetArtifacts,
  [kFimidaraResourceType.PresignedPath]: async ({args, opts}) => {
    return await kSemanticModels
      .presignedPath()
      .getManyByQuery({issuerAgentTokenId: args.resourceId}, opts);
  },
};

const deleteArtifacts: DeleteResourceDeleteArtifactsFns = {
  ...genericDeleteArtifacts,
  [kFimidaraResourceType.PresignedPath]: async ({args, helpers}) => {
    await helpers.withTxn(opts =>
      kSemanticModels
        .presignedPath()
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
