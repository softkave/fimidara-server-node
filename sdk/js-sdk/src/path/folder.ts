import {fimidaraAddRootnameToPath} from './fimidaraAddRootnameToPath.js';

export function stringifyFimidaraFolderpath(
  file: {namepath: string[]},
  rootname?: string
) {
  const name = file.namepath.join('/');
  return rootname ? fimidaraAddRootnameToPath(name, rootname) : name;
}
