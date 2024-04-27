import {uniqBy} from 'lodash';
import {FimidaraPermissionAction} from '../../definitions/permissionItem';
import {kFimidaraResourceType, SessionAgent} from '../../definitions/system';
import {AssignedTagInput} from '../../definitions/tag';
import {Workspace} from '../../definitions/workspace';
import {SemanticProviderOpParams} from '../contexts/semantic/types';
import {checkResourcesBelongsToWorkspace} from '../resources/containerCheckFns';
import {INTERNAL_getResources} from '../resources/getResources';

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
