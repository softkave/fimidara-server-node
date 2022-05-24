import {IAssignedPresetMeta} from '../../../definitions/assignedItem';
import {CollaborationRequestStatusType} from '../../../definitions/collaborationRequest';
import {AppResourceType, SessionAgentType} from '../../../definitions/system';
import {formatDate, getDateString} from '../../../utilities/dateFns';
import {ServerStateConflictError} from '../../../utilities/errors';
import {validate} from '../../../utilities/validate';
import {
  addAssignedPresetList,
  addAssignedUserWorkspace,
} from '../../assignedItems/addAssignedItems';
import {getResourceAssignedItems} from '../../assignedItems/getAssignedItems';
import EndpointReusableQueries from '../../queries';
import {PermissionDeniedError} from '../../user/errors';
import {assertWorkspace} from '../../workspaces/utils';
import {collabRequestExtractor} from '../utils';
import {RespondToRequestEndpoint} from './types';
import {respondToRequestJoiSchema} from './validation';

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

  if (isExpired && request.expiresAt) {
    throw new ServerStateConflictError(
      `Collaboration request expired on ${formatDate(request.expiresAt)}`
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

  if (data.response === CollaborationRequestStatusType.Accepted) {
    await addAssignedUserWorkspace(
      context,
      request.createdBy,
      request.workspaceId,
      user
    );

    const presetsOnAccept = await getResourceAssignedItems(
      context,
      request.workspaceId,
      request.resourceId,
      AppResourceType.CollaborationRequest
    );

    if (presetsOnAccept.length > 0) {
      const workspace = await context.cacheProviders.workspace.getById(
        context,
        request.workspaceId
      );
      assertWorkspace(workspace);
      await addAssignedPresetList(
        context,
        {
          agentId: user.resourceId,
          agentType: SessionAgentType.User,
        },
        workspace,
        presetsOnAccept.map(item => ({
          presetId: item.assignedItemId,
          order: (item.meta as IAssignedPresetMeta)?.order || 1,
        })),
        user.resourceId,
        AppResourceType.User,
        /** deleteExisting */ false,
        /** skipPresetsCheck */ true
      );
    }
  }

  return {
    request: collabRequestExtractor(request),
  };
};

export default respondToRequest;
