import {omit} from 'lodash';
import {Folder} from '../../../definitions/folder';
import {PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {assertFolder, checkFolderAuthorization02, folderExtractor} from '../utils';
import {UpdateFolderEndpoint} from './types';
import {updateFolderJoiSchema} from './validation';

const updateFolder: UpdateFolderEndpoint = async instData => {
  const data = validate(instData.data, updateFolderJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgent(instData, PERMISSION_AGENT_TYPES);
  let folder = await kSemanticModels.utils().withTxn(async opts => {
    const {folder} = await checkFolderAuthorization02(
      agent,
      data,
      'updateFolder',
      /** workspace */ undefined,
      opts
    );
    const update: Partial<Folder> = {
      ...omit(data.folder, 'publicAccessOps'),
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    };
    const updatedFolder = await kSemanticModels
      .folder()
      .getAndUpdateOneById(folder.resourceId, update, opts);
    assertFolder(updatedFolder);
    return updatedFolder;
  });
  folder = await populateAssignedTags(folder.workspaceId, folder);
  return {folder: folderExtractor(folder!)};
};

export default updateFolder;
