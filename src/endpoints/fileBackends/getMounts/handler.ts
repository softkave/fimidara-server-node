import {container} from 'tsyringe';
import {validate} from '../../../utils/validate';
import {kInjectionKeys} from '../../contexts/injection';
import {SemanticFileBackendMountProvider} from '../../contexts/semantic/types';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendMountListExtractor} from '../utils';
import {GetFileBackendMountsEndpoint} from './types';
import {getFileBackendMountsQuery} from './utils';
import {getFileBackendMountsJoiSchema} from './validation';
import {kUtilsInjectables} from '../../contexts/injectables';

const getFileBackendMounts: GetFileBackendMountsEndpoint = async instData => {
  const mountModel = container.resolve<SemanticFileBackendMountProvider>(
    kInjectionKeys.semantic.fileBackendMount
  );

  const data = validate(instData.data, getFileBackendMountsJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  const query = await getFileBackendMountsQuery(agent, workspace, data);
  applyDefaultEndpointPaginationOptions(data);
  const mounts = await mountModel.getManyByQuery(query, data);

  return {
    page: getEndpointPageFromInput(data),
    mounts: fileBackendMountListExtractor(mounts),
  };
};

export default getFileBackendMounts;
