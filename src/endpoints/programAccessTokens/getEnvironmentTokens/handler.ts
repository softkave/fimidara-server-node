import {validate} from '../../../utilities/validate';
import ProgramAccessTokenQueries from '../queries';
import {ProgramAccessTokenUtils} from '../utils';
import {GetEnvironmentProgramAccessTokenEndpoint} from './types';
import {getEnvironmentProgramAccessTokenJoiSchema} from './validation';

const getenvironmentProgramAccessToken: GetEnvironmentProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(
    instData.data,
    getEnvironmentProgramAccessTokenJoiSchema
  );
  const user = await context.session.getUser(context, instData);
  const tokens = await context.data.programAccessToken.getManyItems(
    ProgramAccessTokenQueries.getByEnvironmentId(data.environmentId)
  );

  return {
    tokens: ProgramAccessTokenUtils.extractPublicTokenList(tokens),
  };
};

export default getenvironmentProgramAccessToken;
