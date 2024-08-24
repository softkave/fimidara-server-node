import {Command, Option} from 'commander';
import pkg from '../../package.json';
import {fimidaraSyncCmdDef} from './sync/sync.js';
import {IFimidaraCmdDef} from './types.js';

const program = new Command();

program
  .name('fimidara')
  .description('fimidara CLI')
  .version(pkg?.version || '0.1.0');

function addCmdToProgram(cmd: IFimidaraCmdDef) {
  const pCmd = program
    .command(cmd.cmd)
    .description(cmd.description)
    .action(cmd.action);

  cmd.options.forEach(opt => {
    pCmd.addOption(
      new Option(
        (opt.shortName ? `${opt.shortName}, ` : '') +
          (opt.longName ? `${opt.longName} ` : '') +
          (opt.isRequired ? `<${opt.type}>` : `[${opt.type}]`),
        opt.description
      )
        .choices(opt.choices || [])
        .defaultValue(opt.defaultValue)
    );
  });
}

addCmdToProgram(fimidaraSyncCmdDef as IFimidaraCmdDef);
program.parse();
