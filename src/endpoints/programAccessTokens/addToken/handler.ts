import {IProgramAccessToken} from '../../../definitions/programAccessToken';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';

import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeBasePermissionOwnerList,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import {ProgramAccessTokenUtils} from '../utils';
import {AddProgramAccessTokenEndpoint} from './types';
import {addProgramAccessTokenJoiSchema} from './validation';

const addProgramAccessToken: AddProgramAccessTokenEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, addProgramAccessTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExists(
    context,
    data.organizationId
  );

  await checkAuthorization(
    context,
    agent,
    organization.organizationId,
    null,
    AppResourceType.ProgramAccessToken,
    makeBasePermissionOwnerList(organization.organizationId),
    BasicCRUDActions.Create
  );

  const token: IProgramAccessToken = await context.data.programAccessToken.saveItem(
    {
      ...data,
      tokenId: getNewId(),
      hash: '', // TODO: add hash
      createdAt: getDateString(),
      createdBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
      presets: data.presets.map(item => ({
        ...item,
        assignedAt: getDateString(),
        assignedBy: {
          agentId: agent.agentId,
          agentType: agent.agentType,
        },
      })),
    }
  );

  return {
    token: ProgramAccessTokenUtils.extractPublicToken(token),
  };
};

export default addProgramAccessToken;
