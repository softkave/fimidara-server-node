import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {checkOrganizationExistsWithAgent} from '../../organizations/utils';
import EndpointReusableQueries from '../../queries';
import {GetOrganizationTagEndpoint} from '../../tags/getOrganizationTags/types';
import {getOrganizationTagJoiSchema} from '../../tags/getOrganizationTags/validation';
import {tagExtractor} from '../../tags/utils';
import {PermissionDeniedError} from '../../user/errors';

const getOrganizationTags: GetOrganizationTagEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getOrganizationTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExistsWithAgent(
    context,
    agent,
    data.organizationId
  );

  const tags = await context.data.tag.getManyItems(
    EndpointReusableQueries.getByOrganizationId(organization.resourceId)
  );

  // TODO: can we do this together, so that we don't waste compute
  const permittedReads = await Promise.all(
    tags.map(item =>
      checkAuthorization({
        context,
        agent,
        organization,
        resource: item,
        type: AppResourceType.Tag,
        permissionOwners: makeOrgPermissionOwnerList(organization.resourceId),
        action: BasicCRUDActions.Read,
        nothrow: true,
      })
    )
  );

  const allowedTags = tags
    .filter((item, i) => !!permittedReads[i])
    .map(tag => tagExtractor(tag));

  if (allowedTags.length === 0 && tags.length > 0) {
    throw new PermissionDeniedError();
  }

  return {
    tags: allowedTags,
  };
};

export default getOrganizationTags;
