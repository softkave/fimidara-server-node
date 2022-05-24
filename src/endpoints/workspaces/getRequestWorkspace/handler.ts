import {getFields, makeExtract} from '../../../utilities/extract';
import {validate} from '../../../utilities/validate';
import {assertWorkspace} from '../utils';
import {GetRequestWorkspaceEndpoint, IPublicRequestWorkspace} from './types';
import {getRequestWorkspaceJoiSchema} from './validation';

const requestWorkspaceFields = getFields<IPublicRequestWorkspace>({
  workspaceId: true,
  name: true,
});

export const requestWorkspaceExtractor = makeExtract(requestWorkspaceFields);

const getRequestWorkspace: GetRequestWorkspaceEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getRequestWorkspaceJoiSchema);
  const workspace = await context.cacheProviders.workspace.getById(
    context,
    data.workspaceId
  );
  assertWorkspace(workspace);
  return {
    workspace: requestWorkspaceExtractor(workspace),
  };
};

export default getRequestWorkspace;
