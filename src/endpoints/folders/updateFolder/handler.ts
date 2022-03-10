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
import {updatePublicPresetAccessOps} from '../../permissionItems/utils';
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

  const existingPublicAccessOps = folder.publicAccessOps;
  let publicAccessOps: IPublicAccessOp[] = data.folder.publicAccessOps
    ? data.folder.publicAccessOps.map(op => ({
        ...op,
        markedAt: getDate(),
        markedBy: agent,
      }))
    : [];

  publicAccessOps = compactPublicAccessOps(
    publicAccessOps.concat(existingPublicAccessOps)
  );

  const updatedFolder = await context.data.folder.assertUpdateItem(
    FolderQueries.getById(folder.resourceId),
    {
      ...data.folder,
      publicAccessOps,
      lastUpdatedAt: getDateString(),
      lastUpdatedBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
    }
  );

  await updatePublicPresetAccessOps(
    context,
    agent,
    organization,
    updatedFolder.resourceId,
    AppResourceType.Folder,
    publicAccessOps
  );

  return {folder: folderExtractor(updatedFolder)};
};

export default updateFolder;
