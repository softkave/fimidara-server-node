import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeBasePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import CollaboratorQueries from '../queries';
import {collaboratorListExtractor} from '../utils';
import {GetOrganizationCollaboratorsEndpoint} from './types';
import {getOrganizationCollaboratorsJoiSchema} from './validation';

const getOrganizationCollaborators: GetOrganizationCollaboratorsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getOrganizationCollaboratorsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExists(
    context,
    data.organizationId
  );

  const collaborators = await context.data.user.getManyItems(
    CollaboratorQueries.getByOrganizationId(data.organizationId)
  );

  // TODO: can we do this together, so that we don't waste compute
  const permittedReads = await Promise.all(
    collaborators.map(item =>
      checkAuthorization(
        context,
        agent,
        organization.organizationId,
        item.userId,
        AppResourceType.Collaborator,
        makeBasePermissionOwnerList(organization.organizationId),
        BasicCRUDActions.Read
      )
    )
  );

  const allowedCollaborators = collaborators.filter(
    (item, i) => !!permittedReads[i]
  );

  return {
    collaborators: collaboratorListExtractor(allowedCollaborators),
  };
};

export default getOrganizationCollaborators;
