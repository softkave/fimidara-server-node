import {validate} from '../../../utils/validate';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getWorkspaceCollaborationRequestsQuery} from '../getWorkspaceRequests/utils';
import {CountWorkspaceCollaborationRequestsEndpoint} from './types';
import {countWorkspaceCollaborationRequestsJoiSchema} from './validation';

const countWorkspaceCollaborationRequests: CountWorkspaceCollaborationRequestsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, countWorkspaceCollaborationRequestsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const q = await getWorkspaceCollaborationRequestsQuery(context, agent, workspace);
  const count = await context.semantic.collaborationRequest.countManyByWorkspaceAndIdList(q);
  return {count};
};

export default countWorkspaceCollaborationRequests;
