import {IPublicWorkspace} from '../../../definitions/workspace';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface INewWorkspaceInput {
  name: string;
  description?: string;
}

export type IAddWorkspaceParams = INewWorkspaceInput;

export interface IAddWorkspaceResult {
  workspace: IPublicWorkspace;
}

export type AddWorkspaceEndpoint = Endpoint<
  IBaseContext,
  IAddWorkspaceParams,
  IAddWorkspaceResult
>;
