import {toCompactArray} from '../../../utils/fns';
import {AnyFn} from '../../../utils/types';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';
import {globalDispose} from '../../globalUtils';
import {executeServerInstanceJobs, waitForServerInstanceJobs} from '../../jobs/runner';

export function mutationTest(
  context: BaseContextType,
  name: string,
  fn: AnyFn<[SemanticDataAccessProviderMutationRunOptions]>,
  timeout?: number
) {
  context.semantic.utils.withTxn(context, async options => {
    await test(name, () => fn(options), timeout);
  });
}

export function setupMutationTesting(context: BaseContextType) {
  async function mutationTest(
    name: string,
    fn: AnyFn<[SemanticDataAccessProviderMutationRunOptions]>,
    timeout?: number
  ) {
    context.semantic.utils.withTxn(context, async options => {
      await test(name, () => fn(options), timeout);
    });
  }

  return {mutationTest};
}

export async function completeTest(
  props: {
    context?: (BaseContextType | null) | Array<BaseContextType | null>;
  } = {}
) {
  const {context} = props;

  if (context) {
    await Promise.all(
      toCompactArray(context).map(async context => {
        await executeServerInstanceJobs(context, context.appVariables.serverInstanceId);
        await waitForServerInstanceJobs(context, context.appVariables.serverInstanceId);
        await context.dispose();
      })
    );
  }

  await globalDispose();
}
