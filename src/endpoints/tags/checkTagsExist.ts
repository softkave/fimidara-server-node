import {uniqBy} from 'lodash';
import {PermissionAction} from '../../definitions/permissionItem';
import {AppResourceTypeMap, SessionAgent} from '../../definitions/system';
import {AssignedTagInput} from '../../definitions/tag';
import {Workspace} from '../../definitions/workspace';
import {SemanticProviderRunOptions} from '../contexts/semantic/types';
import {checkResourcesBelongsToWorkspace} from '../resources/containerCheckFns';
import {INTERNAL_getResources} from '../resources/getResources';

export default async function checkTagsExist(
  agent: SessionAgent,
  workspace: Workspace,
  items: Array<AssignedTagInput>,
  action: PermissionAction,
  opts?: SemanticProviderRunOptions
) {
  const resources = await INTERNAL_getResources({
    agent,
    allowedTypes: [AppResourceTypeMap.Tag],
    workspaceId: workspace.resourceId,
    inputResources: uniqBy(items, 'tagId').map(({tagId}) => ({
      action,
      resourceId: tagId,
      resourceType: AppResourceTypeMap.Tag,
    })),
    checkAuth: true,
    dataFetchRunOptions: opts,
  });
  checkResourcesBelongsToWorkspace(workspace.resourceId, resources);
  return {resources};
}
