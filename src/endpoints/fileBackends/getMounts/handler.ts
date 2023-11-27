import {container} from 'tsyringe';
import {validate} from '../../../utils/validate';
import {kInjectionKeys} from '../../contexts/injectionKeys';
import {SemanticDataAccessFileBackendMountProvider} from '../../contexts/semantic/types';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../utils';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendMountListExtractor} from '../utils';
import {GetFileBackendMountEndpoint} from './types';
import {getFileBackendMountQuery} from './utils';
import {getWorkspaceFileBackendMountJoiSchema} from './validation';

const getFileBackendMounts: GetFileBackendMountEndpoint = async (context, instData) => {
  const mountModel = container.resolve<SemanticDataAccessFileBackendMountProvider>(
    kInjectionKeys.semantic.fileBackendMount
  );

  const data = validate(instData.data, getWorkspaceFileBackendMountJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const query = await getFileBackendMountQuery(agent, workspace);
  applyDefaultEndpointPaginationOptions(data);
  const mounts = await mountModel.getManyByWorkspaceAndIdList(query, data);

  return {
    page: getEndpointPageFromInput(data),
    mounts: fileBackendMountListExtractor(mounts),
  };
};

export default getFileBackendMounts;
