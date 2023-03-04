import {logger} from '../../../utils/logger/logger';
import {IBaseContext} from '../../contexts/types';

export async function justInCaseCleanups() {
  await logger.close();
}

export async function cleanupContext(ctx?: IBaseContext | null) {
  if (ctx) {
    await ctx.dispose();
  } else {
    await justInCaseCleanups();
  }
}
