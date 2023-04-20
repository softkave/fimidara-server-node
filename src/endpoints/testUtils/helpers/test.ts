import {toNonNullableArray} from '../../../utils/fns';
import {AnyFn} from '../../../utils/types';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {BaseContext} from '../../contexts/types';
import {disposeApplicationGlobalUtilities} from '../../globalUtils';
import {executeServerInstanceJobs, waitForServerInstanceJobs} from '../../jobs/runner';

export function mutationTest(
  context: BaseContext,
  name: string,
  fn: AnyFn<[SemanticDataAccessProviderMutationRunOptions]>,
  timeout?: number
) {
  executeWithMutationRunOptions(context, async options => {
    await test(name, () => fn(options), timeout);
  });
}

export function setupMutationTesting(context: BaseContext) {
  async function mutationTest(
    name: string,
    fn: AnyFn<[SemanticDataAccessProviderMutationRunOptions]>,
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
    context?: (BaseContext | null) | Array<BaseContext | null>;
  } = {}
) {
  const {context} = props;
  if (context) {
    await Promise.all(
      toNonNullableArray(context).map(async context => {
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
