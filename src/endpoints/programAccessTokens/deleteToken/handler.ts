import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import ProgramAccessTokenQueries from '../queries';
import {checkProgramAccessTokenAuthorizationWithId} from '../utils';
import {DeleteProgramAccessTokenEndpoint} from './types';
import {deleteProgramAccessTokenJoiSchema} from './validation';

const deleteProgramAccessToken: DeleteProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deleteProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {token} = await checkProgramAccessTokenAuthorizationWithId(
    context,
    agent,
    data.tokenId,
    BasicCRUDActions.Delete
  );

  await context.data.programAccessToken.deleteItem(
    ProgramAccessTokenQueries.getById(token.tokenId)
  );
};

export default deleteProgramAccessToken;
