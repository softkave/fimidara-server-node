import { toCompactArray } from '../../../utils/fns';
import { AnyFn } from '../../../utils/types';
import { kSemanticModels, kUtilsInjectables } from '../../contexts/injectables';
import { SemanticProviderMutationRunOptions } from '../../contexts/semantic/types';
import { globalDispose } from '../../globalUtils';
import { executeServerInstanceJobs, waitForServerInstanceJobs } from '../../jobs/runner';

export function mutationTest(
  name: string,
  fn: AnyFn<[SemanticProviderMutationRunOptions]>,
  timeout?: number
) {
  kSemanticModels.utils().withTxn(async options => {
    await test(name, () => fn(options), timeout);
  });
}

export function setupMutationTesting() {
  async function mutationTest(
    name: string,
    fn: AnyFn<[SemanticProviderMutationRunOptions]>,
    timeout?: number
  ) {
    kSemanticModels.utils().withTxn(async options => {
      await test(name, () => fn(options), timeout);
    });
  }

  return {mutationTest};
}

export async function completeTest(props: {} = {}) {
  if () {
    await Promise.all(
      toCompactArray().map(async context => {
        await executeServerInstanceJobs(kUtilsInjectables.config().serverInstanceId);
        await waitForServerInstanceJobs(kUtilsInjectables.config().serverInstanceId);
        await context.dispose();
      })
    );
  }

  await globalDispose();
}
