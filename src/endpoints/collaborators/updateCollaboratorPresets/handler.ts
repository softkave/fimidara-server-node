import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {getOrganizationId} from '../../contexts/SessionContext';
import CollaboratorQueries from '../queries';
import {
  checkCollaboratorAuthorization02,
  collaboratorExtractor,
} from '../utils';
import {UpdateCollaboratorPresetsEndpoint} from './types';
import {updateCollaboratorPresetsJoiSchema} from './validation';

const updateCollaboratorPresets: UpdateCollaboratorPresetsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateCollaboratorPresetsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organizationId = getOrganizationId(agent, data.organizationId);
  const {collaborator} = await checkCollaboratorAuthorization02(
    context,
    agent,
    organizationId,
    data.collaboratorId,
    BasicCRUDActions.Read
  );

  const organizationIndex = collaborator.organizations.findIndex(
    item => item.organizationId === data.organizationId
  );

  const collaboratorOrganization =
    collaborator.organizations[organizationIndex];

  collaboratorOrganization.presets = data.presets.map(item => ({
    ...item,
    assignedAt: getDateString(),
    assignedBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
  }));

  collaborator.organizations[organizationIndex] = collaboratorOrganization;
  await context.data.user.assertUpdateItem(
    CollaboratorQueries.getById(data.collaboratorId),
    {
      organizations: collaborator.organizations,
      lastUpdatedAt: getDateString(),
    }
  );

  const publicData = collaboratorExtractor(collaborator);
  return {
    collaborator: publicData,
  };
};

export default updateCollaboratorPresets;
