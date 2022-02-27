import * as Joi from 'joi';
import {fileConstants} from '../files/constants';

const fileSizeInBytes = Joi.number()
  .integer()
  .max(fileConstants.maxFileSizeInBytes)
  .default(fileConstants.maxFileSizeInBytes);

const mimetype = Joi.string().max(fileConstants.maxMimeTypeCharLength);
const encoding = Joi.string().max(fileConstants.maxEncodingCharLength);
const extension = Joi.string().max(fileConstants.maxExtensionCharLength);
const buffer = Joi.binary().max(fileConstants.maxFileSizeInBytes);

const fileValidationSchemas = {
  fileSizeInBytes,
  mimetype,
  encoding,
  buffer,
  extension,
};

export default fileValidationSchemas;
