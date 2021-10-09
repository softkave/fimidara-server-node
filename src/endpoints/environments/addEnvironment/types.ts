import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicEnvironment} from '../types';

export interface INewEnvironmentInput {
  name: string;
  organizationId: string;
  description?: string;
}

export interface IAddEnvironmentParams {
  environment: INewEnvironmentInput;
}

export interface IAddEnvironmentResult {
  environment: IPublicEnvironment;
}

export type AddEnvironmentEndpoint = Endpoint<
  IBaseContext,
  IAddEnvironmentParams,
  IAddEnvironmentResult
>;
