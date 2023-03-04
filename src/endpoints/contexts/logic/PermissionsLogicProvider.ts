import {
  PermissionEntityInheritanceMap,
  PermissionEntityInheritanceMapItem,
} from '../../../definitions/permissionGroups';

export class PermissionsLogicProvider {
  sortInheritanceMap(props: {map: PermissionEntityInheritanceMap; entityId: string}) {
    const {map} = props;
    let nextOrder = 1;
    const sortEntry = (entry: PermissionEntityInheritanceMapItem) => {
      const {items} = entry;
      entry.resolvedOrder = nextOrder++;
      items.sort((item01, item02) => {
        return item01.assignedAt - item02.assignedAt;
      });
      items.forEach(item => {
        const entry = map[item.assigneeEntityId];
        sortEntry(entry);
      });
    };

    const sortedItemsList = Object.values(map).sort((entry01, entry02) => {
      return (
        (entry01.resolvedOrder ?? Number.MAX_SAFE_INTEGER) -
        (entry02.resolvedOrder ?? Number.MAX_SAFE_INTEGER)
      );
    });

    return {map, sortedItemsList};
  }
}
