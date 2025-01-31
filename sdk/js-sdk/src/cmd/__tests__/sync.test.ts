import {ensureDir} from 'fs-extra';
import {rm} from 'fs/promises';
import path from 'path-browserify';
import {afterAll, beforeAll, describe, test} from 'vitest';
import {$} from 'zx';
import {
  assertCopyFolderFimidara,
  assertCopyFolderLocal,
  assertCopyFolderRecursive,
} from '../../testutils/sync/copyFolderAssertions.js';
import {setupCopyFolder} from '../../testutils/sync/setupCopyFolder.js';
import {fimidaraTestVars} from '../../testutils/tests/file.js';
import {kFimidaraSyncDirection} from '../sync/types.js';

const testDir = path.join(process.cwd(), 'testdir/copyFolder');

beforeAll(async () => {
  await ensureDir(testDir);
});

afterAll(async () => {
  await rm(testDir, {recursive: true, force: true});
});

describe('sync', () => {
  test(
    'sync',
    async () => {
      const {
        fimidarapath,
        localpath,
        pageSize,
        fimidaraFilenames,
        localFilenames,
        ff02List,
        localFoldernames,
        text,
        fimidaraFoldernames,
        lf02List,
        ff03List,
        lf03List,
      } = await setupCopyFolder(testDir);
      const direction = kFimidaraSyncDirection.both;
      const recursive = true;

      await $`npx --yes -- tsx src/cmd/index.ts sync -f "${fimidarapath}" -l "${localpath}" -d "${direction}" -r -m -t "${fimidaraTestVars.authToken}" -u "${fimidaraTestVars.serverURL}"`;

      await assertCopyFolderLocal(
        localpath,
        fimidaraFilenames,
        localFilenames,
        ff02List
          .filter(ff => !!ff.files.filenames.length)
          .map(ff => ff.foldername),
        localFoldernames,
        direction,
        recursive,
        text
      );
      await assertCopyFolderFimidara(
        fimidarapath,
        fimidaraFilenames,
        localFilenames,
        fimidaraFoldernames,
        lf02List
          .filter(lf => !!lf.files.filenames.length)
          .map(lf => lf.foldername),
        direction,
        recursive,
        text
      );
      await assertCopyFolderRecursive(ff02List, lf02List, direction, text);
      await assertCopyFolderRecursive(ff03List, lf03List, direction, text);
    },
    {timeout: 30_000}
  );
});
