import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getProgramAccessTokenId} from '../../contexts/SessionContext';
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

  await context.data.programAccessToken.deleteItem(
    ProgramAccessTokenQueries.getById(token.tokenId)
  );
};

export default deleteProgramAccessToken;
