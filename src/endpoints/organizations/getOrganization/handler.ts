import {validate} from '../../../utilities/validate';
import {canReadOrganization, organizationExtractor} from '../utils';
import {GetOrganizationEndpoint} from './types';
import {getOrganizationJoiSchema} from './validation';

const getOrganization: GetOrganizationEndpoint = async (context, instData) => {
    const data = validate(instData.data, getOrganizationJoiSchema);
    const user = await context.session.getUser(context, instData);
    const organization = await context.organization.assertGetOrganizationById(
        context,
        data.organizationId
    );

    canReadOrganization(user, organization);

    return {
        organization: organizationExtractor(organization),
    };
};

export default getOrganization;
