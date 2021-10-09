import * as Joi from 'joi';
import {fileConstants} from '../files/constants';

const fileSize = Joi.number()
  .integer()
  .max(fileConstants.maxFileSize)
  .default(fileConstants.maxFileSize);

const mime = Joi.string();
const encoding = Joi.string();
const file = Joi.binary();
const meta = Joi.object();

const fileValidationSchemas = {fileSize, mime, encoding, file, meta};

export default fileValidationSchemas;
