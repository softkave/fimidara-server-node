import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {environmentConstants} from '../../environments/constants';
import {FileExistsError} from '../errors';
import {fileExtractor} from '../utils';
import {UploadFileEndpoint} from './types';
import {uploadFileJoiSchema} from './validation';

const uploadFile: UploadFileEndpoint = async (context, instData) => {
  const data = validate(instData.data, uploadFileJoiSchema);
  const user = await context.session.getUser(context, instData);
};

export default uploadFile;
