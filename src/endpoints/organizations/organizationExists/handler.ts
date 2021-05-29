import {validate} from '../../../utilities/validate';
import {OrganizationExistsEndpoint} from './types';
import {organizationExistsJoiSchema} from './validation';

const organizationExists: OrganizationExistsEndpoint = async (
    context,
    instData
) => {
    const data = validate(instData.data, organizationExistsJoiSchema);
    await context.session.assertUser(context, instData);
    const exists = await context.organization.organizationExists(
        context,
        data.name
    );

    return {exists};
};

export default organizationExists;
