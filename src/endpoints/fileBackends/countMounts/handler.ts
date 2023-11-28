import {container} from 'tsyringe';
import {validate} from '../../../utils/validate';
import {kInjectionKeys} from '../../contexts/injection';
import {SemanticFileBackendMountProvider} from '../../contexts/semantic/types';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getFileBackendMountsQuery} from '../getMounts/utils';
import {CountFileBackendMountsEndpoint} from './types';
import {countWorkspaceAgentTokenJoiSchema} from './validation';

const countFileBackendMounts: CountFileBackendMountsEndpoint = async (
  context,
  instData
) => {
  const mountModel = container.resolve<SemanticFileBackendMountProvider>(
    kInjectionKeys.semantic.fileBackendMount
  );

  const data = validate(instData.data, countWorkspaceAgentTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const query = await getFileBackendMountsQuery(agent, workspace);
  const count = await mountModel.countManyByWorkspaceAndIdList(query);

  return {count};
};

export default countFileBackendMounts;
