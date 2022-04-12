import {getFields, makeExtract} from '../../../utilities/extract';
import {validate} from '../../../utilities/validate';
import WorkspaceQueries from '../queries';
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
  const workspace = await context.data.workspace.assertGetItem(
    WorkspaceQueries.getById(data.workspaceId)
  );

  return {
    workspace: requestWorkspaceExtractor(workspace),
  };
};

export default getRequestWorkspace;
