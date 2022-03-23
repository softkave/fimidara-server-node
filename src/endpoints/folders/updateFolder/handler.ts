import {omit} from 'lodash';
import {IFolder} from '../../../definitions/folder';
import {
  AppResourceType,
  BasicCRUDActions,
  IPublicAccessOp,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {compactPublicAccessOps} from '../../../definitions/utils';
import {getDate, getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {getOrganizationId} from '../../contexts/SessionContext';
import {replacePublicPresetAccessOpsByPermissionOwner} from '../../permissionItems/utils';
import FolderQueries from '../queries';
import {checkFolderAuthorization03, folderExtractor} from '../utils';
import {UpdateFolderEndpoint} from './types';
import {updateFolderJoiSchema} from './validation';

const updateFolder: UpdateFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateFolderJoiSchema);
  const agent = await context.session.getAgent(
    context,
    instData,
    publicPermissibleEndpointAgents
  );

  const organizationId = getOrganizationId(agent, data.organizationId);
  const {folder, organization} = await checkFolderAuthorization03(
    context,
    agent,
    organizationId,
    data.path,
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

  let publicAccessOps: IPublicAccessOp[] = [];
  const hasPublicAccessOpsChanges =
    incomingPublicAccessOps.length > 0 || data.folder.removePublicAccessOps;

  if (hasPublicAccessOpsChanges) {
    publicAccessOps = incomingPublicAccessOps
      ? incomingPublicAccessOps.map(op => ({
          ...op,
          markedAt: getDate(),
          markedBy: agent,
        }))
      : [];

    publicAccessOps = compactPublicAccessOps(
      publicAccessOps.concat(folder.publicAccessOps)
    );

    if (data.folder.removePublicAccessOps) {
      publicAccessOps = [];
    }

    update.publicAccessOps = publicAccessOps;
  }

  const updatedFolder = await context.data.folder.assertUpdateItem(
    FolderQueries.getById(folder.resourceId),
    update
  );

  if (hasPublicAccessOpsChanges) {
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
