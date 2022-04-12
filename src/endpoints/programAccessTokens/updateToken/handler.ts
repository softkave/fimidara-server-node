import {omit} from 'lodash';
import {IProgramAccessToken} from '../../../definitions/programAccessToken';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {withAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
import {getProgramAccessTokenId} from '../../contexts/SessionContext';
import {checkProgramTokenNameExists} from '../checkProgramNameExists';
import ProgramAccessTokenQueries from '../queries';
import {
  checkProgramAccessTokenAuthorization02,
  getPublicProgramToken,
} from '../utils';
import {UpdateProgramAccessTokenEndpoint} from './types';
import {updateProgramAccessTokenJoiSchema} from './validation';

const updateProgramAccessToken: UpdateProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const tokenId = getProgramAccessTokenId(
    agent,
    data.tokenId,
    data.onReferenced
  );

  let {workspace, token} = await checkProgramAccessTokenAuthorization02(
    context,
    agent,
    tokenId,
    BasicCRUDActions.Read
  );

  const tokenUpdate: Partial<IProgramAccessToken> = {
    ...omit(data.token, 'presets'),
    lastUpdatedAt: getDateString(),
    lastUpdatedBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
  };

  if (tokenUpdate.name) {
    await checkProgramTokenNameExists(
      context,
      workspace.resourceId,
      tokenUpdate.name
    );
  }

  token = await context.data.programAccessToken.assertUpdateItem(
    ProgramAccessTokenQueries.getById(tokenId),
    tokenUpdate
  );

  await saveResourceAssignedItems(
    context,
    agent,
    workspace,
    token.resourceId,
    AppResourceType.ProgramAccessToken,
    data.token
  );

  token = await withAssignedPresetsAndTags(
    context,
    token.workspaceId,
    token,
    AppResourceType.ProgramAccessToken
  );

  return {
    token: getPublicProgramToken(context, token),
  };
};

export default updateProgramAccessToken;
