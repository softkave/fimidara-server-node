import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import folderValidationSchemas from '../validation';
import {IListFolderContentEndpointParams, IListFolderContentEndpointParamsBase} from './types';

export const listFolderContentBaseJoiSchemaParts: JoiSchemaParts<IListFolderContentEndpointParamsBase> =
  folderValidationSchemas.folderMatcherParts;

export const listFolderContentJoiSchema = Joi.object<IListFolderContentEndpointParams>()
  .keys({
    ...listFolderContentBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
  })
  .required();
