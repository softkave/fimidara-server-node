import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {OrganizationDoesNotExistError} from '../errors';
import {organizationExtractor} from '../utils';
import {UpdateOrganizationEndpoint} from './types';
import {updateOrganizationJoiSchema} from './validation';

const updateOrganization: UpdateOrganizationEndpoint = async (
    context,
    instData
) => {
    const data = validate(instData.data, updateOrganizationJoiSchema);
    const user = await context.session.getUser(context, instData);
    const updatedOrganization = await context.organization.updateOrganizationById(
        context,
        data.organizationId,

        // TODO: does this affect performance?
        {
            ...data.data,
            lastUpdatedAt: getDateString(),
            lastUpdatedBy: user.userId,
        }
    );

    if (!updatedOrganization) {
        throw new OrganizationDoesNotExistError();
    }

    return {organization: organizationExtractor(updatedOrganization)};
};

export default updateOrganization;
