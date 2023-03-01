import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {noopAsync} from '../../../utils/fns';
import {getProgramAccessTokenId} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {DeleteResourceCascadeFnsMap} from '../../types';
import {executeCascadeDelete} from '../../utils';
import {checkProgramAccessTokenAuthorization02} from '../utils';
import {DeleteProgramAccessTokenEndpoint} from './types';
import {deleteProgramAccessTokenJoiSchema} from './validation';

const cascade: DeleteResourceCascadeFnsMap = {
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.Workspace]: noopAsync,
  [AppResourceType.CollaborationRequest]: noopAsync,
  [AppResourceType.ProgramAccessToken]: (context, id) =>
    context.semantic.programAccessToken.deleteOneById(id),
  [AppResourceType.ClientAssignedToken]: noopAsync,
  [AppResourceType.UserToken]: noopAsync,
  [AppResourceType.PermissionGroup]: noopAsync,
  [AppResourceType.PermissionItem]: async (context, id) => {
    await Promise.all([
      context.semantic.permissionItem.deleteManyByTargetId(id),
      context.semantic.permissionItem.deleteManyByEntityId(id),
    ]);
  },
  [AppResourceType.Folder]: noopAsync,
  [AppResourceType.File]: noopAsync,
  [AppResourceType.User]: noopAsync,
  [AppResourceType.Tag]: noopAsync,
  [AppResourceType.AssignedItem]: (context, id) =>
    context.semantic.assignedItem.deleteResourceAssignedItems(id),
  [AppResourceType.UsageRecord]: noopAsync,
  [AppResourceType.EndpointRequest]: noopAsync,
};

const deleteProgramAccessToken: DeleteProgramAccessTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const tokenId = getProgramAccessTokenId(agent, data.tokenId, data.onReferenced);
  await checkProgramAccessTokenAuthorization02(context, agent, tokenId, BasicCRUDActions.Delete);
  await executeCascadeDelete(context, tokenId, cascade);
};

export default deleteProgramAccessToken;
