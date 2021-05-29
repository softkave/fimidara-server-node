import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const appointmentInputJoiSchema = Joi.object().keys({
    customerName: validationSchemas.name,
    customerPhone: validationSchemas.phone,
    description: validationSchemas.description,
    time: validationSchemas.time,
    cancelled: Joi.boolean(),
});

export const updateAppointmentJoiSchema = Joi.object()
    .keys({
        appointmentId: validationSchemas.nanoid.required(),
        data: appointmentInputJoiSchema.required(),
    })
    .required();
