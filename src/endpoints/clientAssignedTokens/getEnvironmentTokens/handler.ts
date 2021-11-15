import {validate} from '../../../utilities/validate';
import ClientAssignedTokenQueries from '../queries';
import {ClientAssignedTokenUtils} from '../utils';
import {GetEnvironmentClientAssignedTokenEndpoint} from './types';
import {getEnvironmentClientAssignedTokenJoiSchema} from './validation';

const getenvironmentClientAssignedToken: GetEnvironmentClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(
    instData.data,
    getEnvironmentClientAssignedTokenJoiSchema
  );
  const user = await context.session.getUser(context, instData);
  const tokens = await context.data.clientAssignedToken.getManyItems(
    ClientAssignedTokenQueries.getByEnvironmentId(data.environmentId)
  );

  return {
    tokens: ClientAssignedTokenUtils.extractPublicTokenList(tokens),
  };
};

export default getenvironmentClientAssignedToken;
