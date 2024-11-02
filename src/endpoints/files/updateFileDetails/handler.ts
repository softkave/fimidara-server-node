import {omit} from 'lodash-es';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {objectHasData} from '../../../utils/fns.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {assertWorkspace} from '../../workspaces/utils.js';
import {
  assertFile,
  fileExtractor,
  getAndCheckFileAuthorization,
} from '../utils.js';
import {UpdateFileDetailsEndpoint} from './types.js';
import {updateFileDetailsJoiSchema} from './validation.js';

/**
 * TODO:
 * - [Medium] Implement name and path update
 */

const updateFileDetails: UpdateFileDetailsEndpoint = async reqData => {
  const data = validate(reqData.data, updateFileDetailsJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentType.api,
      kSessionUtils.accessScope.api
    );
  const file = await kSemanticModels.utils().withTxn(async opts => {
    let file = await getAndCheckFileAuthorization({
      agent,
      opts,
      matcher: data,
      action: kFimidaraPermissionActions.uploadFile,
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

    const workspace = await kSemanticModels
      .workspace()
      .getOneById(file.workspaceId);
    assertWorkspace(workspace);
    return file;
  });

  return {file: fileExtractor(file)};
};

export default updateFileDetails;
