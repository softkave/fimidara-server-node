import {validate} from '../../../utils/validate';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getWorkspaceCollaboratorsQuery} from '../getWorkspaceCollaborators/utils';
import {CountWorkspaceCollaboratorsEndpoint} from './types';
import {countWorkspaceCollaboratorsJoiSchema} from './validation';

const countWorkspaceCollaborators: CountWorkspaceCollaboratorsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, countWorkspaceCollaboratorsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const assignedItemsQuery = await getWorkspaceCollaboratorsQuery(context, agent, workspace);
  const count = await context.semantic.assignedItem.countByQuery(assignedItemsQuery);
  return {count};
};

export default countWorkspaceCollaborators;
