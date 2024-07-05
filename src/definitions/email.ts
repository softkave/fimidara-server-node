import {GetMessageInsightsResponse} from '@aws-sdk/client-sesv2';
import {AnyObject} from 'softkave-js-utils';
import {ValueOf} from 'type-fest';
import {FimidaraConfigEmailProvider} from '../resources/config.js';
import {Resource} from './system.js';

export const kEmailMessageType = {
  collaborationRequest: 'collaborationRequest',
  collaborationRequestExpired: 'collaborationRequestExpired',
  collaborationRequestResponse: 'collaborationRequestResponse',
  collaborationRequestRevoked: 'collaborationRequestRevoked',
  confirmEmailAddress: 'confirmEmailAddress',
  forgotPassword: 'forgotPassword',
  upgradedFromWaitlist: 'upgradedFromWaitlist',
  // usageExceeded: 'usageExceeded',
} as const;

export type EmailMessageType = ValueOf<typeof kEmailMessageType>;

export const kEmailBlocklistReason = {
  bounce: 'bounce',
} as const;

export type EmailBlocklistReason = ValueOf<typeof kEmailBlocklistReason>;

export const kEmailBlocklistTrailType = {
  emailJob: 'emailJob',
} as const;

export type EmailBlocklistTrailType = ValueOf<typeof kEmailBlocklistTrailType>;

export interface CollaborationRequestEmailMessageParams {
  requestId: string;
}

export type EmailMessageParams =
  | {
      type: typeof kEmailMessageType.collaborationRequest;
      params: CollaborationRequestEmailMessageParams;
    }
  | {
      type: typeof kEmailMessageType.collaborationRequestExpired;
      params: CollaborationRequestEmailMessageParams;
    }
  | {
      type: typeof kEmailMessageType.collaborationRequestResponse;
      params: CollaborationRequestEmailMessageParams;
    }
  | {
      type: typeof kEmailMessageType.collaborationRequestRevoked;
      params: CollaborationRequestEmailMessageParams;
    }
  | {type: typeof kEmailMessageType.confirmEmailAddress; params: {}}
  | {type: typeof kEmailMessageType.forgotPassword; params: {}}
  | {type: typeof kEmailMessageType.upgradedFromWaitlist; params: {}};
// | {
//     type: typeof kEmailType.usageExceeded;
//     params: UsageExceededEmailProps;
//   }

export interface EmailMessage<
  TParams extends AnyObject = AnyObject,
  TMeta extends AnyObject = AnyObject,
> extends Resource {
  workspaceId?: string;
  emailAddress: string[];
  userId: string[];
  type: EmailMessageType;
  params: TParams;
  sentAt?: number;
  emailProvider?: FimidaraConfigEmailProvider;
  meta?: TMeta;
}

export interface AWSSESEmailMessageMeta {
  messageInsights: GetMessageInsightsResponse;
}

export type EmailBlocklistTrail = {
  trailType: typeof kEmailBlocklistTrailType.emailJob;
  jobId: string;
};

export interface EmailBlocklist extends Resource {
  emailAddress: string;
  reason?: EmailBlocklistReason;
  trail: EmailBlocklistTrail;
}
