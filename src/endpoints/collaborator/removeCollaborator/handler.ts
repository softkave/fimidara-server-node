import {validate} from '../../../utilities/validate';
import {RemoveCollaboratorEndpoint} from './types';
import {removeCollaboratorJoiSchema} from './validation';

const removeCollaborator: RemoveCollaboratorEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, removeCollaboratorJoiSchema);
  const user = await context.session.getUser(context, instData);
  const collaborator = await context.data.user.assertGetItem();
  collaborator.organizations = collaborator.organizations.filter(
    item => item.organizationId !== data.organizationId
  );

  await context.data.user.updateItem({}, collaborator.organizations);
};

export default removeCollaborator;
