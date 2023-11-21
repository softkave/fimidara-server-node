import {PermissionEntityInheritanceMap} from '../../../definitions/permissionGroups';

export class PermissionsLogicProvider {
  sortInheritanceMap(props: {map: PermissionEntityInheritanceMap; entityId: string}) {
    const {map} = props;
    const sortedItemsList = Object.values(map).sort((entry01, entry02) => {
      return (
        (entry01.resolvedOrder ?? Number.MAX_SAFE_INTEGER) -
        (entry02.resolvedOrder ?? Number.MAX_SAFE_INTEGER)
      );
    });

    return {map, sortedItemsList};
  }
}
