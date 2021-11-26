import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {isObjectEmpty} from '../../../utilities/fns';
import {validate} from '../../../utilities/validate';
import {checkAuthorizationForCollaborationRequest} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import CollaborationRequestQueries from '../queries';
import {collabRequestExtractor} from '../utils';
import {UpdateRequestEndpoint} from './types';
import {updateRequestJoiSchema} from './validation';

const updateRequest: UpdateRequestEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  let request = await context.data.collaborationRequest.assertGetItem(
    CollaborationRequestQueries.getById(data.requestId)
  );

  const organization = await checkOrganizationExists(
    context,
    request.organizationId
  );

  await checkAuthorizationForCollaborationRequest(
    context,
    agent,
    organization.organizationId,
    request,
    BasicCRUDActions.Update
  );

  if (!isObjectEmpty(data.data)) {
    request = await context.data.collaborationRequest.assertUpdateItem(
      CollaborationRequestQueries.getById(data.requestId),
      {
        ...data.data,
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
