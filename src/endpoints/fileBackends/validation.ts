import Joi from 'joi';
import {S3FilePersistenceProviderInitParams} from '../../contexts/file/S3FilePersistenceProvider.js';
import {kFileBackendType} from '../../definitions/fileBackend.js';
import {
  kValidationConstants,
  kValidationRegExPatterns,
} from '../../utils/validationUtils.js';
import {kFileBackendConstants} from './constants.js';

const backend = Joi.string().valid(...Object.values(kFileBackendType));
const nonFimidaraBackend = Joi.string().valid(
  ...Object.values(kFileBackendType).filter(backend => backend !== 'fimidara')
);
const credentials = Joi.object().when('backend', {
  switch: [
    {
      is: Joi.string().valid(kFileBackendType.s3),
      then: Joi.object<S3FilePersistenceProviderInitParams>().keys({
        accessKeyId: Joi.string()
          .alphanum()
          .length(kValidationConstants.awsAccessKeyIdLength)
          .required(),
        secretAccessKey: Joi.string()
          .regex(kValidationRegExPatterns.awsSecretAccessKey)
          .length(kValidationConstants.awsSecretAccessKeyLength)
          .required(),
        region: Joi.string()
          .valid(...kFileBackendConstants.awsRegions)
          .required(),
      }),
    },
  ],
  otherwise: Joi.forbidden(),
});

const fileBackendValidationSchemas = {
  backend,
  credentials,
  nonFimidaraBackend,
};

export default fileBackendValidationSchemas;
