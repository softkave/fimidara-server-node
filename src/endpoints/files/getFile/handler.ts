import {validate} from '../../../utilities/validate';
import {GetFileEndpoint} from './types';
import {getFileJoiSchema} from './validation';

const getFile: GetFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, getFileJoiSchema);
  const user = await context.session.getUser(context, instData);
  const file = await context.file.assertGetFileById(context, data.fileId);

  // TODO: get file binary

  return {};
};

export default getFile;
