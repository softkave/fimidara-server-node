import {validate} from '../../../utilities/validate';
import {organizationExtractor} from '../utils';
import {GetOrganizationEndpoint} from './types';
import {getOrganizationJoiSchema} from './validation';

const getOrganization: GetOrganizationEndpoint = async (context, instData) => {
    const data = validate(instData.data, getOrganizationJoiSchema);
    const organization = await context.organization.assertGetOrganizationById(
        context,
        data.organizationId
    );

    return {
        organization: organizationExtractor(organization),
    };
};

export default getOrganization;
