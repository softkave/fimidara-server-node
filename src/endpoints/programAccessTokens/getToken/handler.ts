import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getProgramAccessTokenId} from '../../contexts/SessionContext';
import {
  checkProgramAccessTokenAuthorization02,
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
  const tokenId = getProgramAccessTokenId(
    agent,
    data.onReferenced && data.tokenId
  );

  const {token} = await checkProgramAccessTokenAuthorization02(
    context,
    agent,
    tokenId,
    BasicCRUDActions.Read
  );

  return {
    token: ProgramAccessTokenUtils.extractPublicToken(token),
  };
};

export default getProgramAccessToken;
