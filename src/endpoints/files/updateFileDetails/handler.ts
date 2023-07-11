import {omit} from 'lodash';
import {AppActionType, PERMISSION_AGENT_TYPES} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {objectHasData} from '../../../utils/fns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {assertWorkspace} from '../../workspaces/utils';
import {assertFile, checkFileAuthorization02, fileExtractor} from '../utils';
import {UpdateFileDetailsEndpoint} from './types';
import {updateFileDetailsJoiSchema} from './validation';

/**
 * TODO:
 * - [Medium] Implement name and path update
 */

const updateFileDetails: UpdateFileDetailsEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateFileDetailsJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  let file = await context.semantic.utils.withTxn(context, async opts => {
    let {file} = await checkFileAuthorization02(context, agent, data, AppActionType.Update, opts);

    if (objectHasData(omit(data.file, 'tags'))) {
      const updatedFile = await context.semantic.file.getAndUpdateOneById(
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

    const workspace = await context.semantic.workspace.getOneById(file.workspaceId);
    assertWorkspace(workspace);
    return file;
  });

  file = await populateAssignedTags(context, file.workspaceId, file);
  return {file: fileExtractor(file)};
};

export default updateFileDetails;
