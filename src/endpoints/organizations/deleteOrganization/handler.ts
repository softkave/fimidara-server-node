import {validate} from '../../../utilities/validate';
import {DeleteOrganizationEndpoint} from './types';
import {deleteOrganizationJoiSchema} from './validation';

const deleteOrganization: DeleteOrganizationEndpoint = async (
    context,
    instData
) => {
    const data = validate(instData.data, deleteOrganizationJoiSchema);
    await context.session.assertUser(context, instData);
    await context.organization.deleteOrganization(context, data.organizationId);

    // delete spaces
    // delete buckets
    // delete auth keys
    // remove orgs in users
    // delete files
    // delete client tokens
};

export default deleteOrganization;
