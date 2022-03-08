import {IPublicOrganization} from '../../../definitions/organization';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface INewOrganizationInput {
  name: string;
  description?: string;
}

export type IAddOrganizationParams = INewOrganizationInput;

export interface IAddOrganizationResult {
  organization: IPublicOrganization;
}

export type AddOrganizationEndpoint = Endpoint<
  IBaseContext,
  IAddOrganizationParams,
  IAddOrganizationResult
>;
