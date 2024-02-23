import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkWorkspaceAuthorization02, workspaceExtractor} from '../utils';
import {GetWorkspaceEndpoint} from './types';
import {getWorkspaceJoiSchema} from './validation';

const getWorkspace: GetWorkspaceEndpoint = async instData => {
  const data = validate(instData.data, getWorkspaceJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await checkWorkspaceAuthorization02(
    agent,
    'readWorkspace',
    data.workspaceId
  );
  return {workspace: workspaceExtractor(workspace)};
};

export default getWorkspace;
