import {uniqBy} from 'lodash';
import {AppResourceType, BasicCRUDActions, ISessionAgent} from '../../definitions/system';
import {IAssignedTagInput} from '../../definitions/tag';
import {IWorkspace} from '../../definitions/workspace';
import {ISemanticDataAccessProviderRunOptions} from '../contexts/semantic/types';
import {IBaseContext} from '../contexts/types';
import {checkResourcesBelongToWorkspace} from '../resources/containerCheckFns';
import {getResources} from '../resources/getResources';

export default async function checkTagsExist(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  items: Array<IAssignedTagInput>,
  action: BasicCRUDActions,
  opts?: ISemanticDataAccessProviderRunOptions
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
    dataFetchRunOptions: opts,
  });
  checkResourcesBelongToWorkspace(workspace.resourceId, resources);
  return {resources};
}
