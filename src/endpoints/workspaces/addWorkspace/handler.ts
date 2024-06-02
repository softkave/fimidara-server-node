import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {
  EmailAddressNotVerifiedError,
  PermissionDeniedError,
} from '../../users/errors.js';
import {workspaceExtractor} from '../utils.js';
import INTERNAL_createWorkspace from './internalCreateWorkspace.js';
import {AddWorkspaceEndpoint} from './types.js';
import {addWorkspaceJoiSchema} from './validation.js';

const addWorkspace: AddWorkspaceEndpoint = async instData => {
  const data = validate(instData.data, addWorkspaceJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.user,
      kSessionUtils.accessScopes.user
    );
  appAssert(agent.user, new PermissionDeniedError());

  // TODO: find other routes that do not use checkAuthorization and devise a way
  // to always check that user is email verified before performing mutation
  // calls
  if (!agent.user.isEmailVerified) {
    throw new EmailAddressNotVerifiedError();
  }

  const {workspace} = await kSemanticModels.utils().withTxn(async opts => {
    appAssert(agent.user, new PermissionDeniedError());
    return await INTERNAL_createWorkspace(
      data,
      agent,
      agent.user.resourceId,
      opts
    );
  });

  return {workspace: workspaceExtractor(workspace)};
};

export default addWorkspace;
