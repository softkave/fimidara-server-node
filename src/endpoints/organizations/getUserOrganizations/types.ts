import {IPublicOrganization} from '../../../definitions/organization';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetUserOrganizationsEndpointResult {
  organizations: IPublicOrganization[];
}

export type GetUserOrganizationsEndpoint = Endpoint<
  IBaseContext,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {},
  IGetUserOrganizationsEndpointResult
>;
