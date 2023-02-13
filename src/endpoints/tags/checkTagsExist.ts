import {uniqBy} from 'lodash';
import {AppResourceType, ISessionAgent} from '../../definitions/system';
import {IAssignedTagInput} from '../../definitions/tag';
import {IWorkspace} from '../../definitions/workspace';
import {IBaseContext} from '../contexts/types';
import {getResources} from '../resources/getResources';
import {checkResourcesBelongToWorkspace} from '../resources/isPartOfOrganization';

export default async function checkTagsExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  items: Array<IAssignedTagInput>
) {
  const resources = await getResources({
    context,
    agent,
    workspace,
    inputResources: uniqBy(items, 'tagId').map(({tagId}) => ({
      resourceId: tagId,
      resourceType: AppResourceType.Tag,
    })),
    checkAuth: true,
  });

  checkResourcesBelongToWorkspace(
    workspace.resourceId,
    resources,
    // Set to true, since we're only dealing with tags
    true
  );

  return {resources};
}
