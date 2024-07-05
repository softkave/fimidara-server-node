import {UsageRecordCategory} from '../../../definitions/usageRecord.js';
import {
  PublicWorkspace,
  UsageThreshold,
} from '../../../definitions/workspace.js';
import {Endpoint} from '../../types.js';

export type UsageThresholdInput = Pick<UsageThreshold, 'category' | 'budget'>;

export interface NewWorkspaceInput {
  name: string;
  rootname: string;
  description?: string;
  usageThresholds?: Partial<Record<UsageRecordCategory, UsageThresholdInput>>;
}

export type AddWorkspaceEndpointParams = Omit<
  NewWorkspaceInput,
  'usageThresholds'
>;

export interface AddWorkspaceEndpointResult {
  workspace: PublicWorkspace;
}

export type AddWorkspaceEndpoint = Endpoint<
  AddWorkspaceEndpointParams,
  AddWorkspaceEndpointResult
>;
