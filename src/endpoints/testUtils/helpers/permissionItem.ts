import {indexArray} from '../../../utils/indexArray';
import {INewPermissionItemInput} from '../../permissionItems/addItems/types';
import {
  getTargetType,
  IPermissionItemBase,
  permissionItemIndexer,
} from '../../permissionItems/utils';

export function expectPermissionItemsPresent(
  entityId: string,
  containerId: string,
  items: IPermissionItemBase[],
  expected: INewPermissionItemInput[]
) {
  const map = indexArray(items, {
    indexer: permissionItemIndexer,
  });
  expected.forEach(item => {
    const targetType = getTargetType(item);
    expect(map[permissionItemIndexer({entityId, containerId, targetType, ...item})]).toMatchObject(
      item
    );
  });
}

function permissionItemInputToItemBase(
  input: INewPermissionItemInput,
  entityId: string,
  containerId: string
): IPermissionItemBase {
  const targetType = getTargetType(input);
  return {
    ...input,
    targetType,
    containerId,
    entityId: entityId,
  };
}

export function expectPermissionItemsForEntityPresent(
  expectedItems: IPermissionItemBase[],
  matches: INewPermissionItemInput[],
  entityId: string,
  containerId: string
) {
  const permissionItemsMap = indexArray(expectedItems, {
    indexer: permissionItemIndexer,
  });
  matches.forEach(item => {
    const input = permissionItemInputToItemBase(item, entityId, containerId);
    const key = permissionItemIndexer(input);
    expect(permissionItemsMap[key]).toMatchObject(item);
  });
}
