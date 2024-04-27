import {omit} from 'lodash';
import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {getTimestamp} from '../../../utils/dateFns';
import {objectHasData} from '../../../utils/fns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {assertWorkspace} from '../../workspaces/utils';
import {assertFile, fileExtractor, getAndCheckFileAuthorization} from '../utils';
import {UpdateFileDetailsEndpoint} from './types';
import {updateFileDetailsJoiSchema} from './validation';

/**
 * TODO:
 * - [Medium] Implement name and path update
 */

const updateFileDetails: UpdateFileDetailsEndpoint = async instData => {
  const data = validate(instData.data, updateFileDetailsJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const file = await kSemanticModels.utils().withTxn(async opts => {
    let file = await getAndCheckFileAuthorization({
      agent,
      opts,
      matcher: data,
      action: kFimidaraPermissionActionsMap.uploadFile,
      incrementPresignedPathUsageCount: true,
    });

    if (objectHasData(omit(data.file, 'tags'))) {
      const updatedFile = await kSemanticModels.file().getAndUpdateOneById(
        file.resourceId,
        {
          ...data.file,
          lastUpdatedAt: getTimestamp(),
          lastUpdatedBy: getActionAgentFromSessionAgent(agent),
        },
        opts
      );

      assertFile(updatedFile);
      file = updatedFile;
    }

    const workspace = await kSemanticModels.workspace().getOneById(file.workspaceId);
    assertWorkspace(workspace);
    return file;
  }, /** reuseTxn */ false);

  return {file: fileExtractor(file)};
};

export default updateFileDetails;
