import {AnyFn} from '../../../utils/types';
import {globalDispose} from '../../contexts/globalUtils';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {SemanticProviderMutationRunOptions} from '../../contexts/semantic/types';
import {executeServerInstanceJobs, waitForServerInstanceJobs} from '../../jobs/runner';

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

export async function completeTests() {
  await Promise.all([
    context.dispose(),
    executeServerInstanceJobs(kUtilsInjectables.config().serverInstanceId),
    waitForServerInstanceJobs(kUtilsInjectables.config().serverInstanceId),
  ]);

  await globalDispose();
}
