import {expect} from 'vitest';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {AppRuntimeState} from '../../../definitions/system.js';

export async function checkRootWorkspace(runtimeVars: AppRuntimeState) {
  await kSemanticModels.workspace().assertGetOneByQuery({
    resourceId: runtimeVars.rootWorkspaceId,
  });

  expect(runtimeVars.isAppSetup).toBeTruthy();
}
