import {UsageThresholdCategory} from '../../../definitions/usageRecord';
import {
  IPublicWorkspace,
  IUsageThreshold,
} from '../../../definitions/workspace';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface INewWorkspaceInput {
  name: string;
  rootname: string;
  description?: string;
  usageThresholds?: Partial<
    Record<UsageThresholdCategory, Pick<IUsageThreshold, 'category' | 'price'>>
  >;
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
