import {css} from '@emotion/css';
import React from 'react';
import TestItem from './TestItem';
import {IInternalTestItem, ITestController} from './types';

export interface ITestListProps {
  tests: IInternalTestItem[];
  controller: ITestController;
  className?: string;
  style?: React.CSSProperties;
}

const classes = {
  test: css({
    borderBottom: '1px solid grey',
    '&:first-of-type': {borderTop: '1px solid grey'},
  }),
};

const TestList: React.FC<ITestListProps> = props => {
  const {controller, tests, className, style} = props;

  return (
    <div className={className} style={style}>
      {tests.map(test => (
        <TestItem
          test={test}
          controller={controller}
          className={classes.test}
        />
      ))}
    </div>
  );
};

export default TestList;
