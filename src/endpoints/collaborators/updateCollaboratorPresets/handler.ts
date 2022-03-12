import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {getOrganizationId} from '../../contexts/SessionContext';
import {checkPresetsExist} from '../../presetPermissionsGroups/utils';
import EndpointReusableQueries from '../../queries';
import {
  checkCollaboratorAuthorization02,
  collaboratorExtractor,
  removeOtherUserOrgs,
} from '../utils';
import {UpdateCollaboratorPresetsEndpoint} from './types';
import {updateCollaboratorPresetsJoiSchema} from './validation';

/**
 * updateCollaboratorPresets. Ensure that:
 * - Check auth on agent
 * - Check that user is a part of organization
 * - Check that presets exist and agent can assign them
 * - Update collaborator presets
 */

const updateCollaboratorPresets: UpdateCollaboratorPresetsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateCollaboratorPresetsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organizationId = getOrganizationId(agent, data.organizationId);
  const {collaborator, organization} = await checkCollaboratorAuthorization02(
    context,
    agent,
    organizationId,
    data.collaboratorId,
    BasicCRUDActions.Update // TODO: should there be a separate update presets action?
  );

  await checkPresetsExist(context, agent, organization, data.presets);
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
    EndpointReusableQueries.getById(data.collaboratorId),
    {
      organizations: collaborator.organizations,
      lastUpdatedAt: getDateString(),
    }
  );

  const publicData = collaboratorExtractor(
    removeOtherUserOrgs(collaborator, organizationId),
    organizationId
  );
  return {
    collaborator: publicData,
  };
};

export default updateCollaboratorPresets;
