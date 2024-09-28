import {uniqBy} from 'lodash-es';
import {SemanticProviderOpParams} from '../../contexts/semantic/types.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {kFimidaraResourceType, SessionAgent} from '../../definitions/system.js';
import {AssignedTagInput} from '../../definitions/tag.js';
import {Workspace} from '../../definitions/workspace.js';
import {checkResourcesBelongsToWorkspace} from '../resources/containerCheckFns.js';
import {INTERNAL_getResources} from '../resources/getResources.js';

export default async function checkTagsExist(
  agent: SessionAgent,
  workspace: Workspace,
  items: Array<AssignedTagInput>,
  action: FimidaraPermissionAction,
  opts?: SemanticProviderOpParams
) {
  const resources = await INTERNAL_getResources({
    agent,
    allowedTypes: [kFimidaraResourceType.Tag],
    workspaceId: workspace.resourceId,
    inputResources: uniqBy(items, 'tagId').map(({tagId}) => ({
      action,
      resourceId: tagId,
      resourceType: kFimidaraResourceType.Tag,
    })),
    checkAuth: true,
    dataFetchRunOptions: opts,
  });
  checkResourcesBelongsToWorkspace(workspace.resourceId, resources);
  return {resources};
}
