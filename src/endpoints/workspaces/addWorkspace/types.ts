import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {IPublicWorkspace} from '../../../definitions/workspace';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface INewWorkspaceInput {
  name: string;
  description?: string;
  totalUsageThreshold?: {price: number};
  usageThresholds?: Array<{
    label: UsageRecordCategory;
    usage?: number;
    price?: number;
  }>;
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
