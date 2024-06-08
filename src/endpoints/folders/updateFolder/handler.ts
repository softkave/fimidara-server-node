import {omit} from 'lodash-es';
import {Folder} from '../../../definitions/folder.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {
  assertFolder,
  checkFolderAuthorization02,
  folderExtractor,
} from '../utils.js';
import {UpdateFolderEndpoint} from './types.js';
import {updateFolderJoiSchema} from './validation.js';

const updateFolder: UpdateFolderEndpoint = async instData => {
  const data = validate(instData.data, updateFolderJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
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
