import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicOrganization} from '../types';

export interface INewOrganizationInput {
  name: string;
  description?: string;
}

export interface IAddOrganizationParams {
  organization: INewOrganizationInput;
}

export interface IAddOrganizationResult {
  organization: IPublicOrganization;
}

export type AddOrganizationEndpoint = Endpoint<
  IBaseContext,
  IAddOrganizationParams,
  IAddOrganizationResult
>;
