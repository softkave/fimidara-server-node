import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkProgramAccessTokenAuthorizationWithId,
  ProgramAccessTokenUtils,
} from '../utils';
import {GetProgramAccessTokenEndpoint} from './types';
import {getProgramAccessTokenJoiSchema} from './validation';

const getProgramAccessToken: GetProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {token} = await checkProgramAccessTokenAuthorizationWithId(
    context,
    agent,
    data.tokenId,
    BasicCRUDActions.Read
  );

  return {
    token: ProgramAccessTokenUtils.extractPublicToken(token),
  };
};

export default getProgramAccessToken;
