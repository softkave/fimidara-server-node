import {uniqBy} from 'lodash';
import {AppActionType, AppResourceType, SessionAgent} from '../../definitions/system';
import {AssignedTagInput} from '../../definitions/tag';
import {Workspace} from '../../definitions/workspace';
import {SemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {BaseContextType} from '../contexts/types';
import {checkResourcesBelongToWorkspace} from '../resources/containerCheckFns';
import {INTERNAL_getResources} from '../resources/getResources';

export default async function checkTagsExist(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  items: Array<AssignedTagInput>,
  action: AppActionType,
  opts?: SemanticDataAccessProviderRunOptions
) {
  const resources = await INTERNAL_getResources({
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
    dataFetchRunOptions: opts,
  });
  checkResourcesBelongToWorkspace(workspace.resourceId, resources);
  return {resources};
}
