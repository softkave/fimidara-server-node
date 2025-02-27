import {kSemanticModels} from '../contexts/injection/injectables.js';

export default async function SCRIPT_clearFailedScripts() {
  await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels.script().deleteFailedScripts(opts);
    await kSemanticModels.script().deleteStaleScripts(opts);
  });
}
