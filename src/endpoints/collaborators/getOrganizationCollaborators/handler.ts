import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {userListWithOrganizations} from '../../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import {PermissionDeniedError} from '../../user/errors';
import CollaboratorQueries from '../queries';
import {collaboratorListExtractor, removeOtherUserOrgs} from '../utils';
import {GetOrganizationCollaboratorsEndpoint} from './types';
import {getOrganizationCollaboratorsJoiSchema} from './validation';

const getOrganizationCollaborators: GetOrganizationCollaboratorsEndpoint =
  async (context, instData) => {
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
        checkAuthorization({
          context,
          agent,
          organization,
          resource: item,
          type: AppResourceType.User,
          permissionOwners: makeOrgPermissionOwnerList(organization.resourceId),
          action: BasicCRUDActions.Read,
          nothrow: true,
        })
      )
    );

    const allowedCollaborators = collaborators.filter(
      (item, i) => !!permittedReads[i]
    );

    if (allowedCollaborators.length === 0 && collaborators.length > 0) {
      throw new PermissionDeniedError();
    }

    const usersWithOrgs = await userListWithOrganizations(
      context,
      allowedCollaborators
    );

    return {
      collaborators: collaboratorListExtractor(
        usersWithOrgs.map(collaborator =>
          removeOtherUserOrgs(collaborator, organization.resourceId)
        ),
        organization.resourceId
      ),
    };
  };

export default getOrganizationCollaborators;
