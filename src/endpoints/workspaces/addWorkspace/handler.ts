import {AppResourceTypeMap} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {EmailAddressNotVerifiedError} from '../../users/errors';
import {workspaceExtractor} from '../utils';
import INTERNAL_createWorkspace from './internalCreateWorkspace';
import {AddWorkspaceEndpoint} from './types';
import {addWorkspaceJoiSchema} from './validation';

const addWorkspace: AddWorkspaceEndpoint = async (context, instData) => {
  const data = validate(instData.data, addWorkspaceJoiSchema);
  const agent = await context.session.getAgent(
    context,
    instData,
    AppResourceTypeMap.User
  );
  appAssert(agent.user);

  // TODO: find other routes that do not use checkAuthorization and devise a way
  // to always check that user is email verified before performing mutation
  // calls
  if (!agent.user.isEmailVerified) throw new EmailAddressNotVerifiedError();

  const {workspace} = await context.semantic.utils.withTxn(context, async opts => {
    appAssert(agent.user);
    return await INTERNAL_createWorkspace(
      context,
      data,
      agent,
      agent.user.resourceId,
      opts
    );
  });
  return {workspace: workspaceExtractor(workspace)};
};

export default addWorkspace;
