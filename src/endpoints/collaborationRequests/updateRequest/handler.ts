import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {isObjectEmpty} from '../../../utilities/fns';
import {validate} from '../../../utilities/validate';
import EndpointReusableQueries from '../../queries';
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
      EndpointReusableQueries.getById(data.requestId),
      {
        message: data.request.message ? data.request.message : request.message,
        expiresAt: data.request.expires,
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
