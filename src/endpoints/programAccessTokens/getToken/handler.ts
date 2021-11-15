import {validate} from '../../../utilities/validate';
import ProgramAccessTokenQueries from '../queries';
import {ProgramAccessTokenUtils} from '../utils';
import {GetProgramAccessTokenEndpoint} from './types';
import {getProgramAccessTokenJoiSchema} from './validation';

const getProgramAccessToken: GetProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getProgramAccessTokenJoiSchema);
  const user = await context.session.getUser(context, instData);
  const token = await context.data.programAccessToken.assertGetItem(
    ProgramAccessTokenQueries.getById(data.tokenId)
  );

  return {
    token: ProgramAccessTokenUtils.extractPublicToken(token),
  };
};

export default getProgramAccessToken;
