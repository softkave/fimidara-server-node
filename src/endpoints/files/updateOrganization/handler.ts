import {getDateString} from '../../../utilities/dateFns';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';
import {validate} from '../../../utilities/validate';
import {OrganizationDoesNotExistError} from '../errors';
import {canReadOrganization, organizationExtractor} from '../utils';
import {UpdateOrganizationEndpoint} from './types';
import {updateOrganizationJoiSchema} from './validation';

const updateOrganization: UpdateOrganizationEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateOrganizationJoiSchema);
  const user = await context.session.getUser(context, instData);
  const organization = await context.organization.assertGetOrganizationById(
    context,
    data.organizationId
  );

  canReadOrganization(user, organization);
  const updatedOrganization = await context.organization.updateOrganizationById(
    context,
    data.organizationId,
    {
      ...data.data,
      lastUpdatedAt: getDateString(),
      lastUpdatedBy: user.userId,
    }
  );

  if (data.data.name) {
    fireAndForgetPromise(
      context.collaborationRequest.updateCollaborationRequestsByOrgId(
        context,
        organization.organizationId,
        {organizationName: data.data.name}
      )
    );
  }

  if (!updatedOrganization) {
    throw new OrganizationDoesNotExistError();
  }

  return {organization: organizationExtractor(updatedOrganization)};
};

export default updateOrganization;
