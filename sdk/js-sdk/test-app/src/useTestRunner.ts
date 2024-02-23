import React from 'react';
import {
  IInternalTestItem,
  ISubmittedTestItem,
  ITestController,
  TestState,
} from './types';

const kTestTypeWeight = {
  // Show manual tests first
  manual: 0,
  auto: 1,
} as const;

export function useTestRunner(props: {submittedTests: ISubmittedTestItem[]}) {
  const {submittedTests} = props;
  const [internalTests, setInternalTests] = React.useState(() => {
    return submittedTests
      .map((test): IInternalTestItem => ({...test, state: 'pending'}))
      .sort((test00, test01) => {
        return (
          (kTestTypeWeight[test00.type] ?? 0) -
          (kTestTypeWeight[test01.type] ?? 0)
        );
      });
  });

  const setTestState = React.useCallback(
    (name: string, state: TestState, error?: any) => {
      setInternalTests(tests => {
        return tests.map(test => {
          if (test.name === name) return {...test, state, error};
          return test;
        });
      });
    },
    []
  );

  const controller = React.useMemo((): ITestController => {
    return {
      setPending(name) {
        setTestState(name, 'pending');
      },
      setRunning(name) {
        setTestState(name, 'running');
      },
      setSuccess(name) {
        setTestState(name, 'running');
      },
      setFailed(name, error) {
        setTestState(name, 'failed', error);
      },
    };
  }, [setTestState]);

  return {controller, tests: internalTests};
}
