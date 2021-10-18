import {IBaseContext} from '../../contexts/BaseContext';
import {IPublicEnvironment} from '../types';
import {Endpoint} from '../../types';

export interface IGetEnvironmentEndpointParams {
  environmentId: string;
}

export interface IGetEnvironmentEndpointResult {
  environment: IPublicEnvironment;
}

export type GetEnvironmentEndpoint = Endpoint<
  IBaseContext,
  IGetEnvironmentEndpointParams,
  IGetEnvironmentEndpointResult
>;
