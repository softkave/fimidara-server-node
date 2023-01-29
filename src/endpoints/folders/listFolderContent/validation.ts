import * as Joi from 'joi';
import {endpointValidationSchemas} from '../../validation';
import folderValidationSchemas from '../validation';
import {IListFolderContentEndpointParams} from './types';

export const listFolderContentJoiSchema = Joi.object<IListFolderContentEndpointParams>()
  .keys({
    ...folderValidationSchemas.folderMatcherParts,
    page: endpointValidationSchemas.page,
    pageSize: endpointValidationSchemas.pageSize,
  })
  .required();
