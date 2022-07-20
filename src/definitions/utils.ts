import {uniqWith} from 'lodash';
import {
  AppResourceType,
  BasicCRUDActions,
  IPublicAccessOp,
  IPublicAccessOpInput,
} from './system';

export function getPublicAccessOpsForType(
  ops: IPublicAccessOp[],
  type: AppResourceType,
  actions: BasicCRUDActions[] = []
) {
  return ops.filter(op =>
    op.resourceType === type && actions.length > 0
      ? actions.includes(op.action)
      : true
  );
}

const publicAccessOpComparator = <T extends IPublicAccessOpInput>(
  op01: T,
  op02: T
) => op01.action === op02.action && op01.resourceType === op02.resourceType;

export function compactPublicAccessOps<T extends IPublicAccessOpInput>(
  ops: T[]
) {
  return uniqWith(ops, publicAccessOpComparator);
}
