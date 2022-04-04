import {IPublicCollaborationRequest} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetOrganizationRequestsEndpointParams {
  organizationId: string;
}

export interface IGetOrganizationRequestsEndpointResult {
  requests: IPublicCollaborationRequest[];
}

export type GetOrganizationRequestsEndpoint = Endpoint<
  IBaseContext,
  IGetOrganizationRequestsEndpointParams,
  IGetOrganizationRequestsEndpointResult
>;
