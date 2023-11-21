import * as Joi from 'joi';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import folderValidationSchemas from '../validation';
import {
  ListFolderContentEndpointParams,
  ListFolderContentEndpointParamsBase,
} from './types';
import {AppResourceTypeMap} from '../../../definitions/system';

const contentType = Joi.string().valid(
  AppResourceTypeMap.File,
  AppResourceTypeMap.Folder
);
export const listFolderContentBaseJoiSchemaParts: JoiSchemaParts<ListFolderContentEndpointParamsBase> =
  {
    ...folderValidationSchemas.folderMatcherParts,
    contentType,
  };

export const listFolderContentJoiSchema = Joi.object<ListFolderContentEndpointParams>()
  .keys({
    ...listFolderContentBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
  })
  .required();
