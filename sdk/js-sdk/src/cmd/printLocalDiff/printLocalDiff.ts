import {createReadStream} from 'fs';
import {printBufferDifferences} from '../../diff/printBufferDifferences.js';
import {compareStreams} from '../../node/compareStreams.js';
import {kFimidaraCmdOpts} from '../constants.js';
import {IFimidaraCmdDef} from '../types.js';
import {IFimidaraPrintLocalDiffOpts} from './types.js';

export async function fimidaraPrintLocalDiff(
  opts: IFimidaraPrintLocalDiffOpts
) {
  if (!opts.silent) {
    console.log('localFilepath01 ', opts.localFilepath01);
    console.log('localFilepath02 ', opts.localFilepath02);
  }

  const stream01 = createReadStream(opts.localFilepath01);
  const stream02 = createReadStream(opts.localFilepath02);

  const diff = await compareStreams(stream01, stream02);
  const print = printBufferDifferences(
    diff.chunk1 || new Uint8Array(),
    diff.chunk2 || new Uint8Array(),
    100
  );

  console.log(print);
}

export const fimidaraPrintLocalDiffCmdDef: IFimidaraCmdDef<IFimidaraPrintLocalDiffOpts> =
  {
    cmd: 'printLocalDiff',
    description: 'Print the local diff between two files',
    options: [
      kFimidaraCmdOpts.silent,
      {
        shortName: '-01',
        longName: '--localFilepath01',
        description: 'file or folderpath on local',
        type: 'string',
        isRequired: true,
      },
      {
        shortName: '-02',
        longName: '--localFilepath02',
        description: 'file or folderpath on local',
        type: 'string',
        isRequired: true,
      },
    ],
    action: fimidaraPrintLocalDiff,
  };
