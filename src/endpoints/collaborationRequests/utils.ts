import {
  ICollaborationRequestSentEmailHistoryItem,
  ICollaborationRequestStatus,
} from '../../definitions/collaborationRequest';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {agentExtractor} from '../utils';
import {IPublicCollaborationRequest} from './types';

const collaborationRequestFields = getFields<IPublicCollaborationRequest>({
  requestId: true,
  recipientEmail: true,
  message: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  expiresAt: getDateString,
  organizationId: true,
  organizationName: true,
  lastUpdatedAt: getDateString,
  lastUpdatedBy: agentExtractor,
  readAt: getDateString,
  statusHistory: makeListExtract(
    getFields<ICollaborationRequestStatus>({
      status: true,
      date: true,
    })
  ),
  sentEmailHistory: makeListExtract(
    getFields<ICollaborationRequestSentEmailHistoryItem>({
      date: true,
      reason: true,
    })
  ),
});

export const collabRequestExtractor = makeExtract(collaborationRequestFields);
export const collabRequestListExtractor = makeListExtract(
  collaborationRequestFields
);
