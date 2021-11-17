import {getFields, makeExtract} from '../../../utilities/extract';
import {validate} from '../../../utilities/validate';
import OrganizationQueries from '../queries';
import {
  GetRequestOrganizationDataEndpoint,
  IPublicRequestOrganizationData,
} from './types';
import {getRequestOrganizationDataJoiSchema} from './validation';

const requestOrganizationDataFields = getFields<IPublicRequestOrganizationData>(
  {
    organizationId: true,
    name: true,
    description: true,
  }
);

export const requestOrganizationDataExtractor = makeExtract(
  requestOrganizationDataFields
);

const getRequestOrganizationData: GetRequestOrganizationDataEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getRequestOrganizationDataJoiSchema);
  const organization = await context.data.organization.assertGetItem(
    OrganizationQueries.getById(data.organizationId)
  );

  return {
    organization: requestOrganizationDataExtractor(organization),
  };
};

export default getRequestOrganizationData;
