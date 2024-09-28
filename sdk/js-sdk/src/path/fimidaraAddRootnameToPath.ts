import {isArray, last} from 'lodash-es';
import path from 'path-browserify';

export function fimidaraAddRootnameToPath<
  T extends string | string[] = string | string[]
>(fPath: T, workspaceRootname: string | string[]): T {
  const rootname = isArray(workspaceRootname)
    ? last(workspaceRootname)
    : workspaceRootname;

  if (isArray(fPath)) {
    return <T>[rootname, ...fPath];
  }

  return <T>path.posix.normalize(`${rootname}/${fPath}`);
}
