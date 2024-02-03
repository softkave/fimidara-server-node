import {kFolderConstants} from '../endpoints/folders/constants';
import {kReuseableErrors} from './reusableErrors';

export interface FimidaraParsedPath {
  volume?: string;
  /** path without volume */
  path: string;
  input: string;
}

export function pathParse(input: string) {
  let p01 = input.split(kFolderConstants.volumeSeparator);
  let volume: string | undefined;
  let pathRest = '';

  if (p01.length > 2) {
    throw kReuseableErrors.file;
  }

  if (p01.length > 1) {
    volume = p01[0];
    pathRest = p01[1];
  }
}
