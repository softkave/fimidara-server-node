import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import {getProgramAccessTokenId} from '../../contexts/SessionContext';
import PermissionItemQueries from '../../permissionItems/queries';
import ProgramAccessTokenQueries from '../queries';
import {checkProgramAccessTokenAuthorization02} from '../utils';
import {DeleteProgramAccessTokenEndpoint} from './types';
import {deleteProgramAccessTokenJoiSchema} from './validation';

const deleteProgramAccessToken: DeleteProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deleteProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const tokenId = getProgramAccessTokenId(
    agent,
    data.onReferenced && data.tokenId
  );

  const {token} = await checkProgramAccessTokenAuthorization02(
    context,
    agent,
    tokenId,
    BasicCRUDActions.Delete
  );

  await waitOnPromises([
    // Delete permission items that explicitly give access to this resource
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByResource(
        token.tokenId,
        AppResourceType.ProgramAccessToken
      )
    ),

    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByPermissionEntity(
        token.tokenId,
        AppResourceType.ProgramAccessToken
      )
    ),

    context.data.programAccessToken.deleteItem(
      ProgramAccessTokenQueries.getById(token.tokenId)
    ),
  ]);
};

export default deleteProgramAccessToken;
