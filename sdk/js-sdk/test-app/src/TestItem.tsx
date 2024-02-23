import {css} from '@emotion/css';
import React from 'react';
import {IInternalTestItem, ITestController} from './types';

export interface ITestItemProps {
  test: IInternalTestItem;
  controller: ITestController;
  className?: string;
  style?: React.CSSProperties;
}

const classes = {
  header: css({display: 'flex', columnGap: '16px'}),
  name: css({flex: 1}),
  headerInfo: css({columnGap: '16px'}),
};

const TestItem: React.FC<ITestItemProps> = props => {
  const {controller, test, className, style} = props;
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    runAutoTest(test, controller);
  }, [test, controller]);

  let node: React.ReactNode = null;
  if (test.type === 'auto') {
    if (test.error) {
      node = <pre>{String(test.error)}</pre>;
    }
  } else if (test.type === 'manual') {
    node = test.fn(controller);
  }

  return (
    <div className={className} style={style}>
      <div className={classes.header} onClick={() => setOpen(!open)}>
        <span className={classes.name}>{test.name}</span>
        <div className={classes.headerInfo}>
          <span>{test.type}</span>
          <span>{test.state}</span>
        </div>
      </div>
      <div>{open && node}</div>
    </div>
  );
};

async function runAutoTest(
  test: IInternalTestItem,
  controller: ITestController
) {
  try {
    if (test.state !== 'pending' || test.type !== 'auto') return;
    controller.setRunning(test.name);
    await test.fn();
    controller.setSuccess(test.name);
  } catch (error: unknown) {
    controller.setFailed(test.name, error);
  }
}

export default TestItem;
