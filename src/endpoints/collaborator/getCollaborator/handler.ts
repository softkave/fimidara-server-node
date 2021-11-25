import {validate} from '../../../utilities/validate';
import {collaboratorExtractor} from '../utils';
import {GetCollaboratorEndpoint} from './types';
import {getCollaboratorJoiSchema} from './validation';

const getCollaborator: GetCollaboratorEndpoint = async (context, instData) => {
  const data = validate(instData.data, getCollaboratorJoiSchema);
  const user = await context.session.getUser(context, instData);

  // TODO: use organizationId
  const collaborator = await context.data.user.assertGetItem();

  const publicData = collaboratorExtractor(collaborator);
  return {
    collaborator: publicData,
  };
};

export default getCollaborator;
