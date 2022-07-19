import * as Joi from 'joi';
import {validationSchemas} from '../../utilities/validationUtils';
import {fileConstants} from '../files/constants';
import {folderConstants} from '../folders/constants';
import folderValidationSchemas from '../folders/validation';
import {UploadFilePublicAccessActions} from './uploadFile/types';

const fileSizeInBytes = Joi.number()
  .integer()
  .max(fileConstants.maxFileSizeInBytes)
  .default(fileConstants.maxFileSizeInBytes);

const mimetype = Joi.string().max(fileConstants.maxMimeTypeCharLength);
const encoding = Joi.string().max(fileConstants.maxEncodingCharLength);
const extension = Joi.string().max(fileConstants.maxExtensionCharLength);
const buffer = Joi.binary().max(fileConstants.maxFileSizeInBytes);
const filepath = Joi.string()
  .regex(folderValidationSchemas.pathRegex)
  .min(folderConstants.minFolderNameLength)
  .max(
    folderConstants.maxFolderNameLength * (folderConstants.maxFolderDepth + 1) +
      fileConstants.maxExtensionCharLength
  );

const publicAccessAction = Joi.string().valid(
  ...Object.values(UploadFilePublicAccessActions)
);

const fileMatcherParts = {
  filepath,
  fileId: validationSchemas.nanoid,
};

const fileValidationSchemas = {
  fileSizeInBytes,
  mimetype,
  encoding,
  buffer,
  extension,
  fileMatcherParts,
  publicAccessAction,
};

export default fileValidationSchemas;
