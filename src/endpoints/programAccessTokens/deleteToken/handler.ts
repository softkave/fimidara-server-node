import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {waitOnPromises} from '../../../utils/waitOnPromises';
import {deleteResourceAssignedItems} from '../../assignedItems/deleteAssignedItems';
import {getProgramAccessTokenId} from '../../contexts/SessionContext';
import PermissionItemQueries from '../../permissionItems/queries';
import EndpointReusableQueries from '../../queries';
import {checkProgramAccessTokenAuthorization02} from '../utils';
import {DeleteProgramAccessTokenEndpoint} from './types';
import {deleteProgramAccessTokenJoiSchema} from './validation';

const deleteProgramAccessToken: DeleteProgramAccessTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, deleteProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const tokenId = getProgramAccessTokenId(agent, data.tokenId, data.onReferenced);
  const {token} = await checkProgramAccessTokenAuthorization02(
    context,
    agent,
    tokenId,
    BasicCRUDActions.Delete
  );
  await waitOnPromises([
    // Delete permission items that explicitly give access to this resource
    context.data.permissionItem.deleteManyByQuery(
      PermissionItemQueries.getByResource(
        token.workspaceId,
        token.resourceId,
        AppResourceType.ProgramAccessToken
      )
    ),

    // Delete token permission items
    context.data.permissionItem.deleteManyByQuery(
      PermissionItemQueries.getByPermissionEntity(token.resourceId)
    ),

    // Delete all assigned items
    deleteResourceAssignedItems(
      context,
      token.workspaceId,
      token.resourceId,
      AppResourceType.ProgramAccessToken
    ),
    context.data.programAccessToken.deleteOneByQuery(
      EndpointReusableQueries.getByResourceId(token.resourceId)
    ),
  ]);
};

export default deleteProgramAccessToken;
