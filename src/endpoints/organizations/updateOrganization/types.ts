import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {INewOrganizationInput} from '../addOrganization/types';
import {IPublicOrganization} from '../types';

export type IUpdateOrganizationInput = Partial<INewOrganizationInput>;

export interface IUpdateOrganizationParams {
  organizationId: string;
  data: IUpdateOrganizationInput;
}

export interface IUpdateOrganizationResult {
  organization: IPublicOrganization;
}

export type UpdateOrganizationEndpoint = Endpoint<
  IBaseContext,
  IUpdateOrganizationParams,
  IUpdateOrganizationResult
>;
