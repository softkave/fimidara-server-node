import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {isObjectEmpty} from '../../../utilities/fns';
import {validate} from '../../../utilities/validate';
import CollaborationRequestQueries from '../queries';
import {
  checkCollaborationRequestAuthorization02,
  collabRequestExtractor,
} from '../utils';
import {UpdateRequestEndpoint} from './types';
import {updateRequestJoiSchema} from './validation';

/**
 * updateRequest.
 * Updates a collaboration request.
 *
 * Ensure that:
 * - Auth check
 * - Update request
 *
 * TODO:
 * - Send email to the recipient of the change
 */

const updateRequest: UpdateRequestEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  let {request} = await checkCollaborationRequestAuthorization02(
    context,
    agent,
    data.requestId,
    BasicCRUDActions.Update
  );

  if (!isObjectEmpty(data.request)) {
    request = await context.data.collaborationRequest.assertUpdateItem(
      CollaborationRequestQueries.getById(data.requestId),
      {
        ...data.request,
        lastUpdatedAt: getDateString(),
        lastUpdatedBy: {
          agentId: agent.agentId,
          agentType: agent.agentType,
        },
      }
    );
  }

  const publicData = collabRequestExtractor(request);
  return {
    request: publicData,
  };
};

export default updateRequest;
