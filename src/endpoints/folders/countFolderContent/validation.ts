import {startJoiObject} from '../../../utils/validationUtils.js';
import {listFolderContentBaseJoiSchemaParts} from '../listFolderContent/validation.js';
import {CountFolderContentEndpointParams} from './types.js';

export const countFolderContentJoiSchema =
  startJoiObject<CountFolderContentEndpointParams>(
    listFolderContentBaseJoiSchemaParts
  ).required();
