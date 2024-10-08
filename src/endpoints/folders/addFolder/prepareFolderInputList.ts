import {convertToArray, pathJoin, pathSplit} from '../../../utils/fns.js';
import {FolderpathInfo, getFolderpathInfo} from '../utils.js';
import {NewFolderInput} from './types.js';

export function prepareFolderInputList(
  input: NewFolderInput | NewFolderInput[]
) {
  const inputList = convertToArray(input);

  // Make a set of individual folders, so "/parent/folder" will become
  // "/parent", and "/parent/folder". This is useful for finding the closest
  // existing folder, and using a set avoids repetitions
  const namepathSet = new Set<string>();
  const pathinfoRecord: Record<string, FolderpathInfo> = {};
  const pathinfoList: FolderpathInfo[] = inputList.map(nextInput => {
    const pathinfo = getFolderpathInfo(nextInput.folderpath, {
      containsRootname: true,
      allowRootFolder: false,
    });

    pathinfo.namepath.forEach((name, index) => {
      namepathSet.add(pathJoin(pathinfo.namepath.slice(0, index + 1)));
    });

    pathinfoRecord[nextInput.folderpath] = pathinfo;
    return pathinfo;
  });

  const namepathList: Array<string[]> = [];
  namepathSet.forEach(namepath => {
    namepathList.push(pathSplit(namepath));
  });

  return {
    pathinfoRecord,
    namepathList,
    pathinfoList,
  };
}
