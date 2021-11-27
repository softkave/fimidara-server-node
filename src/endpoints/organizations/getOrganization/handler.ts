import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkOrganizationAuthorizationWithId,
  organizationExtractor,
} from '../utils';
import {GetOrganizationEndpoint} from './types';
import {getOrganizationJoiSchema} from './validation';

const getOrganization: GetOrganizationEndpoint = async (context, instData) => {
  const data = validate(instData.data, getOrganizationJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {organization} = await checkOrganizationAuthorizationWithId(
    context,
    agent,
    data.organizationId,
    BasicCRUDActions.Delete
  );

  return {
    organization: organizationExtractor(organization),
  };
};

export default getOrganization;
