import {validate} from '../../../utilities/validate';
import ProgramAccessTokenQueries from '../queries';
import {DeleteProgramAccessTokenEndpoint} from './types';
import {deleteProgramAccessTokenJoiSchema} from './validation';

const deleteProgramAccessToken: DeleteProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deleteProgramAccessTokenJoiSchema);
  await context.session.getUser(context, instData);
  await context.data.programAccessToken.deleteItem(
    ProgramAccessTokenQueries.getById(data.tokenId)
  );
};

export default deleteProgramAccessToken;
