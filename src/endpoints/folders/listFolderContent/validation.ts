import * as Joi from 'joi';
import {AppResourceType} from '../../../definitions/system';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import folderValidationSchemas from '../validation';
import {ListFolderContentEndpointParams, ListFolderContentEndpointParamsBase} from './types';

const contentType = Joi.string().valid(AppResourceType.File, AppResourceType.Folder);
export const listFolderContentBaseJoiSchemaParts: JoiSchemaParts<ListFolderContentEndpointParamsBase> =
  {
    ...folderValidationSchemas.folderMatcherParts,
    contentType,
    // contentType: Joi.array()
    //   .items(Joi.string().valid(AppResourceType.File, AppResourceType.Folder))
    //   .max(2),
  };

export const listFolderContentJoiSchema = Joi.object<ListFolderContentEndpointParams>()
  .keys({
    ...listFolderContentBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
  })
  .required();
