import {omit} from 'lodash';
import {IFolder} from '../../../definitions/folder';
import {
  AppResourceType,
  BasicCRUDActions,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {getDate, getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {replacePublicPresetAccessOpsByPermissionOwner} from '../../permissionItems/utils';
import FolderQueries from '../queries';
import {
  checkFolderAuthorization03,
  folderExtractor,
  getFolderMatcher,
} from '../utils';
import {UpdateFolderEndpoint} from './types';
import {updateFolderJoiSchema} from './validation';

const updateFolder: UpdateFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateFolderJoiSchema);
  const agent = await context.session.getAgent(
    context,
    instData,
    publicPermissibleEndpointAgents
  );

  const {folder, organization} = await checkFolderAuthorization03(
    context,
    agent,
    getFolderMatcher(agent, data),
    BasicCRUDActions.Update
  );

  const incomingPublicAccessOps = data.folder.publicAccessOps || [];
  const update: Partial<IFolder> = {
    ...omit(data.folder, 'publicAccessOps'),
    lastUpdatedAt: getDateString(),
    lastUpdatedBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
  };

  const updatedFolder = await context.data.folder.assertUpdateItem(
    FolderQueries.getById(folder.resourceId),
    update
  );

  const hasPublicAccessOpsChanges =
    incomingPublicAccessOps.length > 0 || data.folder.removePublicAccessOps;

  if (hasPublicAccessOpsChanges) {
    let publicAccessOps = incomingPublicAccessOps
      ? incomingPublicAccessOps.map(op => ({
          ...op,
          markedAt: getDate(),
          markedBy: agent,
        }))
      : [];

    if (data.folder.removePublicAccessOps) {
      publicAccessOps = [];
    }

    await replacePublicPresetAccessOpsByPermissionOwner(
      context,
      agent,
      organization,
      updatedFolder.resourceId,
      AppResourceType.Folder,
      publicAccessOps
    );
  }

  return {folder: folderExtractor(updatedFolder)};
};

export default updateFolder;
