import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {INewEnvironmentInput} from '../addEnvironment/types';
import {IPublicEnvironment} from '../types';

export type IUpdateEnvironmentInput = Partial<INewEnvironmentInput>;

export interface IUpdateEnvironmentParams {
  environmentId: string;
  data: IUpdateEnvironmentInput;
}

export interface IUpdateEnvironmentResult {
  environment: IPublicEnvironment;
}

export type UpdateEnvironmentEndpoint = Endpoint<
  IBaseContext,
  IUpdateEnvironmentParams,
  IUpdateEnvironmentResult
>;
