import {AppActionType, AppResourceType, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {summarizeAgentPermissionItems} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';
import {PermissionDeniedError} from '../../user/errors';

export async function getWorkspaceCollaboratorsQuery(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace
) {
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspaceId: workspace.resourceId,
    targets: {targetType: AppResourceType.User},
    action: AppActionType.Read,
  });

  if (permissionsSummaryReport.hasFullOrLimitedAccess) {
    return {
      workspaceId: workspace.resourceId,
      excludedResourceIdList: permissionsSummaryReport.deniedResourceIdList,
    };
  } else if (permissionsSummaryReport.allowedResourceIdList) {
    return {
      workspaceId: workspace.resourceId,
      resourceIdList: permissionsSummaryReport.allowedResourceIdList,
    };
  } else if (permissionsSummaryReport.noAccess) {
    throw new PermissionDeniedError();
  }

  appAssert(false, new ServerError(), 'Control flow should not get here.');
}
