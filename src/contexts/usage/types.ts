import {DisposableResource} from 'softkave-js-utils';
import {Agent} from '../../definitions/system.js';
import {
  UsageRecordArtifact,
  UsageRecordCategory,
  UsageRecordDropReason,
} from '../../definitions/usageRecord.js';

export type IUsageCheckResult =
  | {permitted: true}
  | {
      permitted: false;
      reason: UsageRecordDropReason;
      category: UsageRecordCategory | undefined;
    };

export interface UsageRecordIncrementInput {
  usage: number;
  workspaceId: string;
  category: UsageRecordCategory;
  usageResourceId?: string;
  artifacts?: UsageRecordArtifact[];
}

export interface UsageRecordDecrementInput {
  usage: number;
  workspaceId: string;
  category: UsageRecordCategory;
}

export interface IUsageContext extends DisposableResource {
  // check(params: {
  //   usage: number;
  //   workspaceId: string;
  //   category: UsageRecordCategory;
  // }): Promise<IUsageCheckResult>;
  increment(
    agent: Agent,
    params: UsageRecordIncrementInput
  ): Promise<IUsageCheckResult>;
  decrement(agent: Agent, params: UsageRecordDecrementInput): Promise<void>;
}
