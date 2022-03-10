import {
  BasicCRUDActions,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getOrganizationId} from '../../contexts/SessionContext';
import {checkFolderAuthorization03, folderExtractor} from '../utils';
import {GetFolderEndpoint} from './types';
import {getFolderJoiSchema} from './validation';

const getFolder: GetFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFolderJoiSchema);
  const agent = await context.session.getAgent(
    context,
    instData,
    publicPermissibleEndpointAgents
  );

  const organizationId = getOrganizationId(agent, data.organizationId);
  const {folder} = await checkFolderAuthorization03(
    context,
    agent,
    organizationId,
    data.path,
    BasicCRUDActions.Read
  );

  return {
    folder: folderExtractor(folder),
  };
};

export default getFolder;
