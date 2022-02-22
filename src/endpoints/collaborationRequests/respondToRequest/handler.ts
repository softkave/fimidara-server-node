import {formatDate, getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {ExpiredError} from '../../errors';
import EndpointReusableQueries from '../../queries';
import {PermissionDeniedError} from '../../user/errors';
import {collabRequestExtractor} from '../utils';
import {RespondToRequestEndpoint} from './types';
import {respondToRequestJoiSchema} from './validation';

/**
 * respondToRequest.
 * Updates the response to a collaboration request if it's still open.
 *
 * Ensure that:
 * - Check that user exists
 * - Check that request exists, is open, and the user can respond to it
 * - Update request with the response
 *
 * TODO:
 * - [High] Send notification to the sender that the user has responded
 */

const respondToRequest: RespondToRequestEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, respondToRequestJoiSchema);
  const user = await context.session.getUser(context, instData);
  let request = await context.data.collaborationRequest.assertGetItem(
    EndpointReusableQueries.getById(data.requestId)
  );

  if (user.email !== request.recipientEmail) {
    throw new PermissionDeniedError(
      'User is not the collaboration request recipient'
    );
  }

  const isExpired =
    request.expiresAt && new Date(request.expiresAt).valueOf() < Date.now();

  if (isExpired) {
    throw new ExpiredError(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      `Collaboration request expired on ${formatDate(request.expiresAt!)}`
    );
  }

  request = await context.data.collaborationRequest.assertUpdateItem(
    EndpointReusableQueries.getById(data.requestId),
    {
      statusHistory: request.statusHistory.concat({
        date: getDateString(),
        status: data.response,
      }),
    }
  );

  return {
    request: collabRequestExtractor(request),
  };
};

export default respondToRequest;
