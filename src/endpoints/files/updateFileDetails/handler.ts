import {
  BasicCRUDActions,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {getOrganizationId} from '../../contexts/SessionContext';
import FileQueries from '../queries';
import {checkFileAuthorization03, FileUtils} from '../utils';
import {UpdateFileDetailsEndpoint} from './types';
import {updateFileDetailsJoiSchema} from './validation';

/**
 * TODO:
 * - [Medium] Implement name and path update
 */

const updateFileDetails: UpdateFileDetailsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateFileDetailsJoiSchema);
  const agent = await context.session.getAgent(
    context,
    instData,
    publicPermissibleEndpointAgents
  );

  const organizationId = getOrganizationId(agent, data.organizationId);
  const {file} = await checkFileAuthorization03(
    context,
    agent,
    organizationId,
    data.path,
    BasicCRUDActions.Update
  );

  const updatedFile = await context.data.file.assertUpdateItem(
    FileQueries.getById(file.resourceId),
    {
      ...data.file,
      lastUpdatedAt: getDateString(),
      lastUpdatedBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
    }
  );

  return {
    file: FileUtils.getPublicFile(updatedFile),
  };
};

export default updateFileDetails;
