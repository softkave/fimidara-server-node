import {kIjxSemantic} from '../contexts/ijx/injectables.js';

export default async function SCRIPT_clearFailedScripts() {
  await kIjxSemantic.utils().withTxn(async opts => {
    await kIjxSemantic.script().deleteFailedScripts(opts);
    await kIjxSemantic.script().deleteStaleScripts(opts);
  });
}
