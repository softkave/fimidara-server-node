import {createReadStream, createWriteStream} from 'fs';
import {ensureFile, Stats} from 'fs-extra';
import {Readable, Writable} from 'stream';
import {getFimidara} from '../fimidara.js';
import {IFimidaraCmdOpts} from '../types.js';

function copyToStream(rstream: Readable, wstream: Writable) {
  return new Promise<void>((resolve, reject) => {
    wstream.addListener('close', resolve);
    rstream.addListener('error', reject);
    wstream.addListener('error', reject);
    rstream.pipe(wstream);
  });
}

export async function copyToLocalFile(
  fimidarapath: string,
  localpath: string,
  opts: IFimidaraCmdOpts
) {
  const [{body}] = await Promise.all([
    getFimidara(opts).files.readFile({
      body: {filepath: fimidarapath},
      responseType: 'stream',
    }),
    ensureFile(localpath),
  ]);

  const wstream = createWriteStream(localpath, {autoClose: true});
  await copyToStream(body as Readable, wstream);
}

export async function copyToFimidaraFile(
  fimidarapath: string,
  localpath: string,
  stats: Pick<Stats, 'size'>,
  opts: IFimidaraCmdOpts
) {
  const rstream = createReadStream(localpath, {autoClose: true});
  await getFimidara(opts).files.uploadFile({
    body: {filepath: fimidarapath, data: rstream, size: stats.size},
  });
}
