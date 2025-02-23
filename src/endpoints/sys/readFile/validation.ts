import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import fileValidationSchemas from '../../files/validation.js';
import folderValidationSchemas from '../../folders/validation.js';
import {SysReadFileEndpointParams} from './types.js';

export const sysReadFileJoiSchema = Joi.object<SysReadFileEndpointParams>()
  .keys({
    workspaceId: kValidationSchemas.resourceId.required(),
    fileId: kValidationSchemas.resourceId.required(),
    mountId: kValidationSchemas.resourceId.required(),
    part: fileValidationSchemas.partWithoutLastPart,
    multipartId: fileValidationSchemas.multipartId,
    namepath: folderValidationSchemas.namepath.required(),
    ext: fileValidationSchemas.ext,
  })
  .required();
