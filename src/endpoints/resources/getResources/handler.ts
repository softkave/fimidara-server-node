import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getPublicClientToken} from '../../clientAssignedTokens/utils';
import {getWorkspaceId} from '../../contexts/SessionContext';
import {getPublicProgramToken} from '../../programAccessTokens/utils';
import {checkWorkspaceExists} from '../../workspaces/utils';
import {getPublicResourceList} from '../getPublicResource';
import {getResources as fetchResources} from '../getResources';
import {getResourcesPartOfWorkspace} from '../isPartOfOrganization';
import {resourceListWithAssignedItems} from '../resourceWithAssignedItems';
import {GetResourcesEndpoint} from './types';
import {getResourcesJoiSchema} from './validation';

const getResources: GetResourcesEndpoint = async (context, instData) => {
  const data = validate(instData.data, getResourcesJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const workspace = await checkWorkspaceExists(context, workspaceId);
  let resources = await fetchResources({
    context,
    agent,
    workspace,
    inputResources: data.resources,
    checkAuth: true,
    action: BasicCRUDActions.Read,
    nothrowOnCheckError: true,
  });

  resources = await resourceListWithAssignedItems(
    context,
    workspaceId,
    resources
  );

  resources = getResourcesPartOfWorkspace(workspaceId, resources, true);
  resources = resources.map(resource => {
    switch (resource.resourceType) {
      case AppResourceType.ProgramAccessToken:
        resource.resource = getPublicProgramToken(
          context,
          resource.resource as any
        );
        return resource;
      case AppResourceType.ClientAssignedToken:
        resource.resource = getPublicClientToken(
          context,
          resource.resource as any
        );
        return resource;
      default:
        return resource;
    }
  });

  return {
    resources: getPublicResourceList(resources, workspaceId),
  };
};

export default getResources;
