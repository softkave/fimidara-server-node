import {first, last} from 'lodash-es';
import {format, formatWithOptions} from 'util';
import {appAssert} from '../../../utils/assertion.js';
import {ServerError} from '../../../utils/errors.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {assertRootname, assertWorkspace} from '../../workspaces/utils.js';
import {folderExtractor, getFolderpathInfo} from '../utils.js';
import {createFolderList} from './createFolderList.js';
import {AddFolderEndpoint} from './types.js';
import {addFolderJoiSchema} from './validation.js';

const addFolder: AddFolderEndpoint = async reqData => {
  const data = validate(reqData.data, addFolderJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const pathinfo = getFolderpathInfo(data.folder.folderpath, {
    containsRootname: true,
    allowRootFolder: false,
  });
  assertRootname(pathinfo.rootname);
  const workspace = await kSemanticModels
    .workspace()
    .getByRootname(pathinfo.rootname);
  assertWorkspace(workspace);

  const {folders, failedInput} = await createFolderList(
    agent,
    workspace,
    data.folder,
    /** UNSAFE_skipAuthCheck */ false,
    /** throwOnFolderExists */ true,
    /** throwOnError */ false
  );

  failedInput.forEach(failedItem => {
    const stringifiedInput = formatWithOptions({depth: 5}, failedItem.input);
    kUtilsInjectables
      .logger()
      .error(
        `Error adding folders ${stringifiedInput} with reason ${format(
          failedItem.reason
        )}`
      );
  });

  // The last folder will be the folder represented by our input, seeing it
  // creates parent folders in order
  const folder = last(folders);
  const error0 = first(failedInput)?.reason;
  appAssert(
    folder,
    (error0 as Error) || new ServerError('Error creating folder')
  );

  return {folder: folderExtractor(folder)};
};

export default addFolder;
