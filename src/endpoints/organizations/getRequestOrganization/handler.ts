import {getFields, makeExtract} from '../../../utilities/extract';
import {validate} from '../../../utilities/validate';
import OrganizationQueries from '../queries';
import {
  GetRequestOrganizationEndpoint,
  IPublicRequestOrganization,
} from './types';
import {getRequestOrganizationJoiSchema} from './validation';

const requestOrganizationFields = getFields<IPublicRequestOrganization>({
  organizationId: true,
  name: true,
});

export const requestOrganizationExtractor = makeExtract(
  requestOrganizationFields
);

const getRequestOrganization: GetRequestOrganizationEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getRequestOrganizationJoiSchema);
  const organization = await context.data.organization.assertGetItem(
    OrganizationQueries.getById(data.organizationId)
  );

  return {
    organization: requestOrganizationExtractor(organization),
  };
};

export default getRequestOrganization;
