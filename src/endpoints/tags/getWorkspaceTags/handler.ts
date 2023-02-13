import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {ITag} from '../../../definitions/tag';
import {validate} from '../../../utils/validate';
import {
  makeWorkspacePermissionContainerList,
  summarizeAgentPermissionItems,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import EndpointReusableQueries from '../../queries';
import {PermissionDeniedError} from '../../user/errors';
import {getEndpointPageFromInput} from '../../utils';
import {checkWorkspaceExistsWithAgent} from '../../workspaces/utils';
import {tagExtractor} from '../utils';
import {GetWorkspaceTagEndpoint} from './types';
import {getWorkspaceTagJoiSchema} from './validation';

const getWorkspaceTags: GetWorkspaceTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, getWorkspaceTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspace = await checkWorkspaceExistsWithAgent(context, agent, data.workspaceId);
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspace,
    type: AppResourceType.ProgramAccessToken,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
    action: BasicCRUDActions.Read,
  });
  let tags: Array<ITag> = [];
  if (permissionsSummaryReport.hasFullOrLimitedAccess) {
    tags = await context.data.tag.getManyByQuery(
      EndpointReusableQueries.getByWorkspaceIdAndExcludeResourceIdList(
        workspace.resourceId,
        permissionsSummaryReport.deniedResourceIdList
      ),
      data
    );
  } else if (permissionsSummaryReport.allowedResourceIdList) {
    tags = await context.data.tag.getManyByQuery(
      EndpointReusableQueries.getByWorkspaceIdAndResourceIdList(
        workspace.resourceId,
        permissionsSummaryReport.allowedResourceIdList
      ),
      data
    );
  } else if (permissionsSummaryReport.noAccess) {
    throw new PermissionDeniedError();
  }

  tags = tags.map(tag => tagExtractor(tag));
  return {tags, page: getEndpointPageFromInput(data)};
};

export default getWorkspaceTags;
