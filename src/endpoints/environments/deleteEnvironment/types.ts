import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IDeleteEnvironmentParams {
  environmentId: string;
}

export type DeleteEnvironmentEndpoint = Endpoint<
  IBaseContext,
  IDeleteEnvironmentParams
>;
