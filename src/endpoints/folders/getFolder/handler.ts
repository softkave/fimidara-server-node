import {
  BasicCRUDActions,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkFolderAuthorization03,
  folderExtractor,
  getFolderMatcher,
} from '../utils';
import {GetFolderEndpoint} from './types';
import {getFolderJoiSchema} from './validation';

const getFolder: GetFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFolderJoiSchema);
  const agent = await context.session.getAgent(
    context,
    instData,
    publicPermissibleEndpointAgents
  );

  const {folder} = await checkFolderAuthorization03(
    context,
    agent,
    getFolderMatcher(agent, data),
    BasicCRUDActions.Read
  );

  return {
    folder: folderExtractor(folder),
  };
};

export default getFolder;
