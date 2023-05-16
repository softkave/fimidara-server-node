import {FilePresignedPath} from '../../../definitions/file';
import {AppActionType, AppResourceType, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {newWorkspaceResource} from '../../../utils/resource';
import {validate} from '../../../utils/validate';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {checkFileAuthorization03} from '../utils';
import {IssueFilePresignedPathEndpoint} from './types';
import {issueFilePresignedPathJoiSchema} from './validation';

const issueFilePresignedPath: IssueFilePresignedPathEndpoint = async (context, instData) => {
  const data = validate(instData.data, issueFilePresignedPathJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  const {file} = await checkFileAuthorization03(context, agent, data, AppActionType.Read);
  let expiresAt = data.expires;

  if (!expiresAt && data.duration) {
    expiresAt = Date.now() + data.duration;
  }

  const resource = newWorkspaceResource<FilePresignedPath>(
    agent,
    AppResourceType.FilePresignedPath,
    file.workspaceId,
    {
      expiresAt,
      fileId: file.resourceId,
      action: [AppActionType.Read],
      agentTokenId: agent.agentTokenId,
      usageCount: data.usageCount,
      spentUsageCount: 0,
    }
  );

  await executeWithMutationRunOptions(context, async opts => {
    await context.semantic.filePresignedPath.insertItem(resource, opts);
  });

  return {path: resource.resourceId};
};

export default issueFilePresignedPath;
