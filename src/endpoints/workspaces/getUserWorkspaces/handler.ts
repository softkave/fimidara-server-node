import {validate} from '../../../utils/validate';
import EndpointReusableQueries from '../../queries';
import {getEndpointPageFromInput} from '../../utils';
import {workspaceListExtractor} from '../utils';
import {GetUserWorkspacesEndpoint} from './types';
import {getUserWorkspacesJoiSchema} from './validation';

const getUserWorkspaces: GetUserWorkspacesEndpoint = async (context, d) => {
  const data = validate(d.data, getUserWorkspacesJoiSchema);
  const user = await context.session.getUser(context, d);
  const workspaces = await context.data.workspace.getManyByQuery(
    EndpointReusableQueries.getByResourceIdList(user.workspaces.map(workspace => workspace.workspaceId)),
    data
  );
  return {page: getEndpointPageFromInput(data), workspaces: workspaceListExtractor(workspaces)};
};

export default getUserWorkspaces;
