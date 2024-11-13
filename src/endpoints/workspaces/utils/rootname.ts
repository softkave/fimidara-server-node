import {kWorkspaceConstants} from '../constants.js';

export function finalizeRootname(workspaceLevel: number, rootname: string) {
  return (
    kWorkspaceConstants.rootnamePrefix +
    workspaceLevel +
    kWorkspaceConstants.rootnamePrefixSeparator +
    rootname
  );
}

export function isRootname(name: string) {
  return kWorkspaceConstants.rootnameRegex.test(name);
}
