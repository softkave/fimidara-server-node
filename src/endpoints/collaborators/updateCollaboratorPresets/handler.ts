import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {withUserOrganizations} from '../../assignedItems/getAssignedItems';
import {getOrganizationId} from '../../contexts/SessionContext';
import {
  checkCollaboratorAuthorization02,
  collaboratorExtractor,
  removeOtherUserOrgs,
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
  let {collaborator, organization} = await checkCollaboratorAuthorization02(
    context,
    agent,
    organizationId,
    data.collaboratorId,
    BasicCRUDActions.Update
  );

  await saveResourceAssignedItems(
    context,
    agent,
    organization,
    collaborator.resourceId,
    AppResourceType.User,
    data,
    true
  );

  collaborator = await withUserOrganizations(context, collaborator);
  const publicData = collaboratorExtractor(
    removeOtherUserOrgs(collaborator, organizationId),
    organizationId
  );

  return {
    collaborator: publicData,
  };
};

export default updateCollaboratorPresets;
