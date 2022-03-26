import {
  AppResourceType,
  BasicCRUDActions,
  publicPermissibleEndpointAgents,
} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {replacePublicPresetAccessOpsByPermissionOwner} from '../../permissionItems/utils';
import EndpointReusableQueries from '../../queries';
import FileQueries from '../queries';
import {makeFilePublicAccessOps} from '../uploadFile/accessOps';
import {checkFileAuthorization03, FileUtils, getFileMatcher} from '../utils';
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

  const {file} = await checkFileAuthorization03(
    context,
    agent,
    getFileMatcher(agent, data),
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

  if (data.file.publicAccessActions) {
    const publicAccessOps = makeFilePublicAccessOps(
      agent,
      data.file.publicAccessActions
    );

    const organization = await context.data.organization.assertGetItem(
      EndpointReusableQueries.getById(file.organizationId)
    );

    await replacePublicPresetAccessOpsByPermissionOwner(
      context,
      agent,
      organization,
      file.resourceId,
      AppResourceType.File,
      publicAccessOps,
      file.resourceId
    );
  }

  return {
    file: FileUtils.getPublicFile(updatedFile),
  };
};

export default updateFileDetails;
