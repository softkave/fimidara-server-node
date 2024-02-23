# Permissions

```typescript
interface Permission {
  entityId: string;
  targetId: string;
  action: string;
  access: boolean;
}
```

- Access check for a single object will use `entity` (and `parents`), `target` (and `parents`), and action. `access` will then be used to allow and deny access.
  - For each check, we'll fetch all entity parents
  - For each check, we'll fetch info on all target parents
  - Sort permissions by entity (then parents), and for each entity by target (then parents)
  - Allow if first permission grants access, deny if it does not
- Access check for a resource's children
  - Access check first using the parent, and if no access, then
    - Individual access check on each child
      - For access check on each child, we can do bulk-fetch, seeing we don't need to do parent check, then index by target ID
      - May be a bit expensive, but we can consider Redis
    - Pre-fetch check, then fetch permitted children
      - To do pre-fetch check, we need to be able to check permission using parent ID, but do we want to store parent ID per permission target?
- For each check, include public permission group check
- Access check resolved permissions should be indexed by first item in target entry

```typescript
interface AccessCheckTarget {
  targetId: string | string[];
}

interface AccessCheckParams {
  entityId?: string;
  workspace?: Pick<Workspace, 'resourceId' | 'publicPermissionGroupId'>;
  target: AccessCheckTarget | AccessCheckTarget[];
  action: PermissionAction;
}
```
