import {randomUUID} from 'crypto';
import {kFimidaraCmdOpts} from '../constants.js';
import {IFimidaraCmdDef} from '../types.js';
import {copyFileOrFolder} from './copyFileOrFolder.js';
import {IFimidaraSyncOpts, IFimidaraSyncRuntimeOpts} from './types.js';

export async function fimidaraSync(opts: IFimidaraSyncOpts) {
  const clientMultipartIdPrefix = randomUUID();
  const runtimeOpts: IFimidaraSyncRuntimeOpts = {
    ...opts,
    clientMultipartIdPrefix,
  };

  if (!opts.silent) {
    console.log('fimidarapath ', runtimeOpts.fimidarapath);
    console.log('localpath    ', runtimeOpts.localpath);
    console.log('direction    ', runtimeOpts.direction);
    console.log('recursive    ', runtimeOpts.recursive);
    console.log('matchTree    ', runtimeOpts.matchTree);
  }

  await copyFileOrFolder(runtimeOpts);
}

export const fimidaraSyncCmdDef: IFimidaraCmdDef<IFimidaraSyncOpts> = {
  cmd: 'sync',
  description: 'Sync a file or folder with fimidara',
  options: [
    kFimidaraCmdOpts.authToken,
    kFimidaraCmdOpts.serverURL,
    kFimidaraCmdOpts.silent,
    {
      shortName: '-f',
      longName: '--fimidarapath',
      description: 'file or folderpath on fimidara',
      type: 'string',
      isRequired: true,
    },
    {
      shortName: '-l',
      longName: '--localpath',
      description: 'file or folderpath on local',
      type: 'string',
      isRequired: true,
    },
    {
      shortName: '-d',
      longName: '--direction',
      description:
        'what direction to sync. "up" to upload, "down" to download, "both" for both.',
      type: 'direction',
      isRequired: true,
      choices: ['up', 'down', 'both'],
    },
    {
      shortName: '-r',
      longName: '--recursive',
      description:
        'include folder children content, not just files. ' +
        'defaults to true.',
      type: 'boolean',
      isRequired: false,
      defaultValue: true,
    },
    {
      shortName: '-m',
      longName: '--matchTree',
      description:
        'match folder tree one-to-one. ' +
        'if "direction" is "up", deletes files in fimidara not found in local, and ' +
        'if "down", deletes files in local not found in fimidara. ' +
        'defaults to false.',
      type: 'boolean',
      isRequired: false,
    },
  ],
  action: fimidaraSync,
};
