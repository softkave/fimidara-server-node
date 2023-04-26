import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {PublicWorkspace, UsageThreshold} from '../../../definitions/workspace';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export type UsageThresholdInput = Pick<UsageThreshold, 'category' | 'budget'>;

export interface NewWorkspaceInput {
  name: string;
  rootname: string;
  description?: string;
  usageThresholds?: Partial<Record<UsageRecordCategory, UsageThresholdInput>>;
}

export type AddWorkspaceEndpointParams = Omit<NewWorkspaceInput, 'usageThresholds'>;

export interface AddWorkspaceEndpointResult {
  workspace: PublicWorkspace;
}

export type AddWorkspaceEndpoint = Endpoint<
  BaseContextType,
  AddWorkspaceEndpointParams,
  AddWorkspaceEndpointResult
>;
