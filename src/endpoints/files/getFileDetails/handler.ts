import {validate} from '../../../utilities/validate';
import {IBaseContext} from '../../contexts/BaseContext';
import {folderConstants} from '../../folders/constants';
import FileQueries from '../queries';
import {FileUtils} from '../utils';
import {GetFileDetailsEndpoint} from './types';
import {getFileDetailsJoiSchema} from './validation';

export async function getFileByIdOrPath(
  context: IBaseContext,
  fileId: string | null | undefined,
  path: string | null | undefined
) {
  if (fileId) {
    return await context.data.file.assertGetItem(FileQueries.getById(fileId));
  } else if (path) {
    return await context.data.file.assertGetItem(
      FileQueries.getByNamePath(path.split(folderConstants.folderNameSeparator))
    );
  }

  throw new Error(); // TODO: add the right error
}

const getFileDetails: GetFileDetailsEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFileDetailsJoiSchema);
  const user = await context.session.getUser(context, instData);
  const file = await getFileByIdOrPath(context, data.fileId, data.path);

  return {
    file: FileUtils.getPublicFile(file),
  };
};

export default getFileDetails;
