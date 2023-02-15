import {validate} from '../../../utils/validate';
import {getEndpointPageFromInput, getWorkspaceFromEndpointInput} from '../../utils';
import {collaborationRequestListExtractor, populateRequestListPermissionGroups} from '../utils';
import {GetWorkspaceCollaborationRequestsEndpoint} from './types';
import {getWorkspaceCollaborationRequestsQuery} from './utils';
import {getWorkspaceCollaborationRequestsJoiSchema} from './validation';

const getWorkspaceCollaborationRequests: GetWorkspaceCollaborationRequestsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getWorkspaceCollaborationRequestsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const q = await getWorkspaceCollaborationRequestsQuery(context, agent, workspace);
  let requests = await context.data.collaborationRequest.getManyByQuery(q, data);
  requests = await populateRequestListPermissionGroups(context, requests);
  return {
    page: getEndpointPageFromInput(data),
    requests: collaborationRequestListExtractor(requests),
  };
};

export default getWorkspaceCollaborationRequests;
