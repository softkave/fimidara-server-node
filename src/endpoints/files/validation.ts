import * as Joi from 'joi';
import {Readable} from 'stream';
import {validationSchemas} from '../../utils/validationUtils';
import {kFolderConstants} from '../folders/constants';
import folderValidationSchemas from '../folders/validation';
import {fileConstants} from './constants';

const fileSizeInBytes = Joi.number().min(0).max(fileConstants.maxFileSizeInBytes);
const mimetype = Joi.string().max(fileConstants.maxMimeTypeCharLength);
const encoding = Joi.string().max(fileConstants.maxEncodingCharLength);
const extension = Joi.string().max(fileConstants.maxExtensionCharLength);
const buffer = Joi.binary().max(fileConstants.maxFileSizeInBytes);
const filepath = Joi.string()
  .regex(folderValidationSchemas.pathRegex)
  .min(kFolderConstants.minFolderNameLength)
  .max(
    kFolderConstants.maxFolderNameLength * (kFolderConstants.maxFolderDepth + 1) +
      fileConstants.maxExtensionCharLength
  );
const readable = Joi.any().custom((value, helpers) => {
  if (value instanceof Readable) {
    return value;
  }
  throw new Error('Invalid data provided.');
});

const fileMatcherParts = {
  filepath,
  fileId: validationSchemas.resourceId,
};

const fileValidationSchemas = {
  fileSizeInBytes,
  mimetype,
  encoding,
  buffer,
  extension,
  readable,
  fileMatcherParts,
};

export default fileValidationSchemas;
