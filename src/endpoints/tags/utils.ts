import {ITag, IPublicTag, IAssignedTag} from '../../definitions/tag';
import {
  ISessionAgent,
  BasicCRUDActions,
  AppResourceType,
} from '../../definitions/system';
import {getDateString, getDateStringIfPresent} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {NotFoundError} from '../errors';
import {checkOrganizationExists} from '../organizations/utils';
import {agentExtractor, agentExtractorIfPresent} from '../utils';
import EndpointReusableQueries from '../queries';

const assignedTagFields = getFields<IAssignedTag>({
  tagId: true,
  assignedAt: getDateString,
  assignedBy: agentExtractor,
});

export const assignedTagExtractor = makeExtract(assignedTagFields);
export const assignedTagListExtractor = makeListExtract(assignedTagFields);

const tagFields = getFields<IPublicTag>({
  resourceId: true,
  createdAt: getDateString,
  createdBy: agentExtractor,
  organizationId: true,
  name: true,
  description: true,
  lastUpdatedAt: getDateStringIfPresent,
  lastUpdatedBy: agentExtractorIfPresent,
});

export const tagExtractor = makeExtract(tagFields);
export const tagListExtractor = makeListExtract(tagFields);

export async function checkTagAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  tag: ITag,
  action: BasicCRUDActions,
  nothrow = false
) {
  const organization = await checkOrganizationExists(
    context,
    tag.organizationId
  );

  await checkAuthorization({
    context,
    agent,
    organization,
    action,
    nothrow,
    resource: tag,
    type: AppResourceType.Tag,
    permissionOwners: makeOrgPermissionOwnerList(organization.resourceId),
  });

  return {agent, tag, organization};
}

export async function checkTagAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  id: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const tag = await context.data.tag.assertGetItem(
    EndpointReusableQueries.getById(id)
  );

  return checkTagAuthorization(context, agent, tag, action, nothrow);
}

export function throwTagNotFound() {
  throw new NotFoundError('Tag not found');
}
