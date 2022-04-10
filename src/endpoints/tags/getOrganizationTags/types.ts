import {IPublicTag} from '../../../definitions/tag';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetOrganizationTagsEndpointParams {
  organizationId?: string;
}

export interface IGetOrganizationTagsEndpointResult {
  tags: IPublicTag[];
}

export type GetOrganizationTagEndpoint = Endpoint<
  IBaseContext,
  IGetOrganizationTagsEndpointParams,
  IGetOrganizationTagsEndpointResult
>;
