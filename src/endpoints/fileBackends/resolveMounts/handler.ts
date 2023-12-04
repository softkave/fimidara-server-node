import {container} from 'tsyringe';
import {validate} from '../../../utils/validate';
import {kInjectionKeys} from '../../contexts/injection';
import {SemanticFileBackendMountProvider} from '../../contexts/semantic/types';
import {
  applyDefaultEndpointPaginationOptions,
  resolveEndpointPageFromInput,
} from '../../utils';
import {resolveWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendMountListExtractor} from '../utils';
import {ResolveFileBackendMountsEndpoint} from './types';
import {resolveFileBackendMountsQuery} from './utils';
import {resolveWorkspaceFileBackendMountJoiSchema} from './validation';

const resolveFileBackendMounts: ResolveFileBackendMountsEndpoint = async (
  context,
  instData
) => {
  const mountModel = container.resolve<SemanticFileBackendMountProvider>(
    kInjectionKeys.semantic.fileBackendMount
  );

  const data = validate(instData.data, resolveWorkspaceFileBackendMountJoiSchema);
  const agent = await context.session.resolveAgent(context, instData);
  const {workspace} = await resolveWorkspaceFromEndpointInput(context, agent, data);
  const query = await resolveFileBackendMountsQuery(agent, workspace);
  applyDefaultEndpointPaginationOptions(data);
  const mounts = await mountModel.resolveManyByWorkspaceAndIdList(query, data);

  return {
    page: resolveEndpointPageFromInput(data),
    mounts: fileBackendMountListExtractor(mounts),
  };
};

export default resolveFileBackendMounts;
