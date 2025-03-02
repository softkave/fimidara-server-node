import {kIjxSemantic} from '../../../../contexts/ijx/injectables.js';
import {kFimidaraResourceType} from '../../../../definitions/system.js';
import {
  genericDeleteArtifacts,
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
  [kFimidaraResourceType.PresignedPath]: async ({args, opts}) => {
    return await kIjxSemantic
      .presignedPath()
      .getManyByQuery({issuerAgentTokenId: args.resourceId}, opts);
  },
};

const deleteArtifacts: DeleteResourceDeleteArtifactsFns = {
  ...genericDeleteArtifacts,
  [kFimidaraResourceType.PresignedPath]: async ({args, helpers}) => {
    await helpers.withTxn(opts =>
      kIjxSemantic
        .presignedPath()
        .deleteManyByQuery({issuerAgentTokenId: args.resourceId}, opts)
    );
  },
};

const deleteResourceFn: DeleteResourceFn = ({args, helpers}) =>
  helpers.withTxn(opts =>
    kIjxSemantic.agentToken().deleteOneById(args.resourceId, opts)
  );

export const deleteAgentTokenCascadeEntry: DeleteResourceCascadeEntry = {
  deleteResourceFn,
  getArtifactsToDelete: getArtifacts,
  deleteArtifacts: deleteArtifacts,
  getPreRunMetaFn: noopGetPreRunMetaFn,
};
