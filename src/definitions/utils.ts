import {uniqWith} from 'lodash';
import {IPublicAccessOp, AppResourceType, BasicCRUDActions} from './system';

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

const publicAccessOpComparator = (
  op01: IPublicAccessOp,
  op02: IPublicAccessOp
) => op01.action === op02.action && op01.resourceType === op02.resourceType;

export function compactPublicAccessOps(ops: IPublicAccessOp[]) {
  return uniqWith(ops, publicAccessOpComparator);
}
