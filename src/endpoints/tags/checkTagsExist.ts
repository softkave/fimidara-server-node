import {uniqBy} from 'lodash';
import {AppResourceType, BasicCRUDActions, ISessionAgent} from '../../definitions/system';
import {IAssignedTagInput} from '../../definitions/tag';
import {IWorkspace} from '../../definitions/workspace';
import {IBaseContext} from '../contexts/types';
import {checkResourcesBelongToWorkspace} from '../resources/containerCheckFns';
import {getResources} from '../resources/getResources';

export default async function checkTagsExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  items: Array<IAssignedTagInput>,
  action: BasicCRUDActions
) {
  const resources = await getResources({
    context,
    agent,
    action,
    allowedTypes: [AppResourceType.Tag],
    workspaceId: workspace.resourceId,
    inputResources: uniqBy(items, 'tagId').map(({tagId}) => ({
      resourceId: tagId,
      resourceType: AppResourceType.Tag,
    })),
    checkAuth: true,
  });
  checkResourcesBelongToWorkspace(workspace.resourceId, resources);
  return {resources};
}
