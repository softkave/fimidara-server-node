import {omit} from 'lodash-es';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {Folder} from '../../../definitions/folder.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {
  assertFolder,
  checkFolderAuthorization02,
  folderExtractor,
} from '../utils.js';
import {UpdateFolderEndpoint} from './types.js';
import {updateFolderJoiSchema} from './validation.js';

const updateFolder: UpdateFolderEndpoint = async reqData => {
  const data = validate(reqData.data, updateFolderJoiSchema);
  const {agent} = await initEndpoint(reqData, {data});

  let folder = await kSemanticModels.utils().withTxn(async opts => {
    const {folder} = await checkFolderAuthorization02(
      agent,
      data,
      kFimidaraPermissionActions.updateFolder,
      /** workspaceId */ undefined,
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
