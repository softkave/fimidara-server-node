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

export const kUsageRecordQueueInputType = {
  increment: 'increment',
  decrement: 'decrement',
} as const;

export type IUsageRecordQueueInput =
  | {
      type: typeof kUsageRecordQueueInputType.increment;
      input: UsageRecordIncrementInput;
    }
  | {
      type: typeof kUsageRecordQueueInputType.decrement;
      input: UsageRecordDecrementInput;
    };

export type IUsageRecordQueueOutput =
  | {
      type: typeof kUsageRecordQueueInputType.increment;
      result: IUsageCheckResult;
    }
  | {
      type: typeof kUsageRecordQueueInputType.decrement;
      result: void;
    };

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
  // TODO: run after writes instead of always
  startCommitBatchedUsageL1Interval(): void;
  startCommitBatchedUsageL2Interval(): void;
}
