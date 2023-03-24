import {toArray} from '../../../utils/fns';
import {AnyFn} from '../../../utils/types';
import {ISemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {IBaseContext} from '../../contexts/types';
import {disposeApplicationGlobalUtilities} from '../../globalUtils';
import {executeServerInstanceJobs, waitForServerInstanceJobs} from '../../jobs/runner';

export function mutationTest(
  context: IBaseContext,
  name: string,
  fn: AnyFn<[ISemanticDataAccessProviderMutationRunOptions]>,
  timeout?: number
) {
  executeWithMutationRunOptions(context, async options => {
    await test(name, () => fn(options), timeout);
  });
}

export function setupMutationTesting(context: IBaseContext) {
  async function mutationTest(
    name: string,
    fn: AnyFn<[ISemanticDataAccessProviderMutationRunOptions]>,
    timeout?: number
  ) {
    executeWithMutationRunOptions(context, async options => {
      await test(name, () => fn(options), timeout);
    });
  }

  return {mutationTest};
}

export async function completeTest(
  props: {
    context?: (IBaseContext | null) | Array<IBaseContext | null>;
  } = {}
) {
  const {context} = props;
  if (context) {
    await Promise.all(
      toArray(context).map(async context => {
        if (context) {
          await executeServerInstanceJobs(context, context.appVariables.serverInstanceId);
          await waitForServerInstanceJobs(context, context.appVariables.serverInstanceId);
          await context.dispose();
        }
      })
    );
  }

  await disposeApplicationGlobalUtilities();
}
