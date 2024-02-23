import React from 'react';

export type AnyFn<Args extends any[] = any[], Result = any> = (
  ...args: Args
) => Result;

export type TestState = 'pending' | 'running' | 'success' | 'failed';

export interface ITestController {
  setPending(name: string): void;
  setRunning(name: string): void;
  setSuccess(name: string): void;
  setFailed(name: string, error: any): void;
}

export type ISubmittedTestItem =
  | {
      type: 'auto';
      name: string;
      fn: AnyFn<[IInternalTestItem], void | Promise<void>>;
    }
  | {
      type: 'manual';
      name: string;
      fn: AnyFn<[IInternalTestItem, ITestController], React.ReactElement>;
    };

export type IInternalTestItem = ISubmittedTestItem & {
  state: TestState;
  error?: any;
};
