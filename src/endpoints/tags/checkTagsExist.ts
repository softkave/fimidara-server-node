import {uniqBy} from 'lodash';
import {IWorkspace} from '../../definitions/workspace';
import {AppResourceType, ISessionAgent} from '../../definitions/system';
import {IAssignedTagInput} from '../../definitions/tag';
import {IBaseContext} from '../contexts/BaseContext';
import {getResources} from '../resources/getResources';
import {checkNotWorkspaceResources} from '../resources/isPartOfWorkspace';

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

  checkNotWorkspaceResources(
    workspace.resourceId,
    resources,
    // Set to true, since we're only dealing with tags
    true
  );

  return {resources};
}
