import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {
  EmailAddressNotVerifiedError,
  PermissionDeniedError,
} from '../../users/errors.js';
import {workspaceExtractor} from '../utils.js';
import INTERNAL_createWorkspace from './internalCreateWorkspace.js';
import {AddWorkspaceEndpoint} from './types.js';
import {addWorkspaceJoiSchema} from './validation.js';

const addWorkspace: AddWorkspaceEndpoint = async reqData => {
  const data = validate(reqData.data, addWorkspaceJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
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

  const {workspace} = await kIjxSemantic.utils().withTxn(async opts => {
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
