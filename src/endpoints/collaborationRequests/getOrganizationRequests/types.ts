import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicCollaborationRequest} from '../types';

export interface IGetOrganizationRequestsParams {
  organizationId: string;
}

export interface IGetOrganizationRequestsResult {
  requests: IPublicCollaborationRequest[];
}

export type GetOrganizationRequestsEndpoint = Endpoint<
  IBaseContext,
  IGetOrganizationRequestsParams,
  IGetOrganizationRequestsResult
>;
