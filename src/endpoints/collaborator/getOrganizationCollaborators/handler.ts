import {validate} from '../../../utilities/validate';
import {collaboratorListExtractor} from '../utils';
import {GetOrganizationCollaboratorsEndpoint} from './types';
import {getOrganizationCollaboratorsJoiSchema} from './validation';

const getOrganizationCollaborators: GetOrganizationCollaboratorsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getOrganizationCollaboratorsJoiSchema);
  const user = await context.session.getUser(context, instData);
  // TODO: check that organization exists. Same for other endpoints.
  const collaborators = await context.data.user.getManyItems();

  return {
    collaborators: collaboratorListExtractor(collaborators),
  };
};

export default getOrganizationCollaborators;
