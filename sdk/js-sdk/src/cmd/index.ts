import {Command, Option} from 'commander';
import pkg from '../../package.json';
import {fimidaraSync} from './sync/sync.js';

const program = new Command();

program
  .name('fimidara')
  .description('fimidara CLI')
  .version(pkg?.version || '0.1.0');

program
  .command('sync')
  .description('Sync a file or folder with fimidara')
  .addOption(
    new Option('-f, --fimidarapath <string>', 'file or folderpath on fimidara')
  )
  .addOption(
    new Option('-l, --localpath <string>', 'file or folderpath on local')
  )
  .addOption(
    new Option(
      '-d, --direction <direction>',
      'what direction to sync. "up" to upload, "down" to download, "both" for both.'
    ).choices(['up', 'down', 'both'])
  )
  .addOption(
    new Option(
      '-r, --recursive [boolean]',
      'include folder children content, not just files. ' + 'defaults to true.'
    ).defaultValue(true)
  )
  .addOption(
    new Option(
      '-m, --match [boolean]',
      'match folder tree one-to-one. ' +
        'if "direction" is "up", deletes files in fimidara not found in local, and ' +
        'if "down", deletes files in local not found in fimidara. ' +
        'defaults to false.'
    ).defaultValue(false)
  )
  .action(async options => {
    await fimidaraSync(options);
  });

program.parse();
