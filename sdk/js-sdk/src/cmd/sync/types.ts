import {ValueOf} from 'type-fest';
import {IFimidaraCmdOpts} from '../types.js';

export const kFimidaraSyncDirection = {
  up: 'up',
  down: 'down',
  both: 'both',
} as const;

export type FimidaraSyncDirection = ValueOf<typeof kFimidaraSyncDirection>;

export interface IFimidaraSyncOpts extends IFimidaraCmdOpts {
  direction: FimidaraSyncDirection;
  /** fimidara file or folderpath */
  fimidarapath: string;
  /** local file or folderpath */
  localpath: string;
  /** sync children folders */
  recursive?: boolean;
  /** if `direction` is `up`, deletes files in fimidara not found in local, and
   * if `down`, deletes files in local not found in fimidara */
  matchTree?: boolean;
}

export interface IFimidaraSyncRuntimeOpts extends IFimidaraSyncOpts {
  clientMultipartIdPrefix: string;
}

export const kFileEntryType = {
  file: 'file',
  folder: 'folder',
} as const;

export type FileEntryType = ValueOf<typeof kFileEntryType>;
