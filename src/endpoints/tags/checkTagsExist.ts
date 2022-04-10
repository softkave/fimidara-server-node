import {uniqBy} from 'lodash';
import {IOrganization} from '../../definitions/organization';
import {AppResourceType, ISessionAgent} from '../../definitions/system';
import {IAssignedTagInput} from '../../definitions/tag';
import {IBaseContext} from '../contexts/BaseContext';
import {getResources} from '../resources/getResources';
import {checkNotOrganizationResources} from '../resources/isPartOfOrganization';

export default async function checkTagsExist(
  context: IBaseContext,
  agent: ISessionAgent,
  organization: IOrganization,
  items: Array<IAssignedTagInput>
) {
  const resources = await getResources({
    context,
    agent,
    organization,
    inputResources: uniqBy(items, 'tagId').map(({tagId}) => ({
      resourceId: tagId,
      resourceType: AppResourceType.Tag,
    })),
    checkAuth: true,
  });

  checkNotOrganizationResources(
    organization.resourceId,
    resources,
    // Set to true, since we're only dealing with tags
    true
  );

  return {resources};
}
