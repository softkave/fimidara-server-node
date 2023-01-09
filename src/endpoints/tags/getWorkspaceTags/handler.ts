import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import EndpointReusableQueries from '../../queries';
import {PermissionDeniedError} from '../../user/errors';
import {checkWorkspaceExistsWithAgent} from '../../workspaces/utils';
import {tagExtractor} from '../utils';
import {GetWorkspaceTagEndpoint} from './types';
import {getWorkspaceTagJoiSchema} from './validation';

const getWorkspaceTags: GetWorkspaceTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, getWorkspaceTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspace = await checkWorkspaceExistsWithAgent(context, agent, data.workspaceId);

  const tags = await context.data.tag.getManyByQuery(EndpointReusableQueries.getByWorkspaceId(workspace.resourceId));

  // TODO: can we do this together, so that we don't waste compute
  const permittedReads = await Promise.all(
    tags.map(item =>
      checkAuthorization({
        context,
        agent,
        workspace,
        resource: item,
        type: AppResourceType.Tag,
        permissionOwners: makeWorkspacePermissionOwnerList(workspace.resourceId),
        action: BasicCRUDActions.Read,
        nothrow: true,
      })
    )
  );

  const allowedTags = tags.filter((item, i) => !!permittedReads[i]).map(tag => tagExtractor(tag));

  if (allowedTags.length === 0 && tags.length > 0) {
    throw new PermissionDeniedError();
  }

  return {
    tags: allowedTags,
  };
};

export default getWorkspaceTags;
