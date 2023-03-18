import {AnyFn} from '../../../utils/types';
import {ISemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {IBaseContext} from '../../contexts/types';

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
