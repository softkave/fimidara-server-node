import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {getProgramAccessTokenId} from '../../contexts/SessionContext';
import {checkPresetsExist} from '../../presetPermissionsGroups/utils';
import ProgramAccessTokenQueries from '../queries';
import {
  checkProgramAccessTokenAuthorization02,
  programAccessTokenExtractor,
} from '../utils';
import {UpdateProgramAccessTokenPresetsEndpoint} from './types';
import {updateProgramAccessTokenPresetsJoiSchema} from './validation';

const updateProgramAccessTokenPresets: UpdateProgramAccessTokenPresetsEndpoint = async (
  context,
  instData
) => {
  const data = validate(
    instData.data,
    updateProgramAccessTokenPresetsJoiSchema
  );

  const agent = await context.session.getAgent(context, instData);
  const tokenId = getProgramAccessTokenId(
    agent,
    data.onReferenced && data.tokenId
  );

  const checkResult = await checkProgramAccessTokenAuthorization02(
    context,
    agent,
    tokenId,
    BasicCRUDActions.Read
  );

  await checkPresetsExist(
    context,
    agent,
    checkResult.organization.organizationId,
    data.presets
  );

  let token = checkResult.token;
  token = await context.data.programAccessToken.assertUpdateItem(
    ProgramAccessTokenQueries.getById(tokenId),
    {
      presets: data.presets.map(preset => ({
        ...preset,
        assignedAt: getDateString(),
        assignedBy: {
          agentId: agent.agentId,
          agentType: agent.agentType,
        },
      })),
    }
  );

  return {
    token: programAccessTokenExtractor(token),
  };
};

export default updateProgramAccessTokenPresets;
