import {omit} from 'lodash';
import {IClientAssignedToken} from '../../../definitions/clientAssignedToken';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDate} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {withAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
import EndpointReusableQueries from '../../queries';
import {checkClientTokenNameExists} from '../checkClientTokenNameExists';
import {
  checkClientAssignedTokenAuthorization03,
  getPublicClientToken,
} from '../utils';
import {UpdateClientAssignedTokenEndpoint} from './types';
import {updateClientAssignedTokenPresetsJoiSchema} from './validation';

const updateClientAssignedToken: UpdateClientAssignedTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(
    instData.data,
    updateClientAssignedTokenPresetsJoiSchema
  );

  const agent = await context.session.getAgent(context, instData);
  let {organization, token} = await checkClientAssignedTokenAuthorization03(
    context,
    agent,
    data,
    BasicCRUDActions.Update
  );

  if (data.token.name) {
    await checkClientTokenNameExists(
      context,
      organization.resourceId,
      data.token.name
    );
  }

  const update: Partial<IClientAssignedToken> = {
    ...omit(data.token, 'presets', 'tags'),
    lastUpdatedAt: getDate(),
    lastUpdatedBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
  };

  token = await context.data.clientAssignedToken.assertUpdateItem(
    EndpointReusableQueries.getById(token.resourceId),
    update
  );

  await saveResourceAssignedItems(
    context,
    agent,
    organization,
    token.resourceId,
    AppResourceType.ClientAssignedToken,
    data.token
  );

  token = await withAssignedPresetsAndTags(
    context,
    token.organizationId,
    token,
    AppResourceType.ClientAssignedToken
  );

  return {
    token: getPublicClientToken(context, token),
  };
};

export default updateClientAssignedToken;
