import {
  AppActionType,
  AppResourceType,
  getWorkspaceResourceTypeList,
} from '../../../definitions/system';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {getResourcesPartOfWorkspace} from '../containerCheckFns';
import {getPublicResourceList} from '../getPublicResource';
import {INTERNAL_getResources} from '../getResources';
import {resourceListWithAssignedItems} from '../resourceWithAssignedItems';
import {GetResourcesEndpoint} from './types';
import {getResourcesJoiSchema} from './validation';

const allowedTypes = getWorkspaceResourceTypeList().filter(type => type !== AppResourceType.All);
const getResources: GetResourcesEndpoint = async (context, instData) => {
  const data = validate(instData.data, getResourcesJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  let resources = await INTERNAL_getResources({
    context,
    agent,
    allowedTypes,
    workspaceId: workspace.resourceId,
    inputResources: data.resources,
    checkAuth: true,
    action: AppActionType.Read,
    nothrowOnCheckError: true,
  });
  resources = await resourceListWithAssignedItems(context, workspaceId, resources);
  resources = getResourcesPartOfWorkspace(workspaceId, resources);
  return {resources: getPublicResourceList(resources, workspaceId)};
};

export default getResources;
