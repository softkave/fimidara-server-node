import {kFimidaraResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {EmailAddressNotVerifiedError} from '../../users/errors';
import {workspaceExtractor} from '../utils';
import INTERNAL_createWorkspace from './internalCreateWorkspace';
import {AddWorkspaceEndpoint} from './types';
import {addWorkspaceJoiSchema} from './validation';

const addWorkspace: AddWorkspaceEndpoint = async instData => {
  const data = validate(instData.data, addWorkspaceJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, kFimidaraResourceType.User);
  appAssert(agent.user);

  // TODO: find other routes that do not use checkAuthorization and devise a way
  // to always check that user is email verified before performing mutation
  // calls
  if (!agent.user.isEmailVerified) {
    throw new EmailAddressNotVerifiedError();
  }

  const {workspace} = await kSemanticModels.utils().withTxn(async opts => {
    appAssert(agent.user);
    return await INTERNAL_createWorkspace(data, agent, agent.user.resourceId, opts);
  }, /** reuseTxn */ false);

  return {workspace: workspaceExtractor(workspace)};
};

export default addWorkspace;
