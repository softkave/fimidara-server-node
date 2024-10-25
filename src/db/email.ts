import {Connection, Document, Model, Schema, SchemaTypes} from 'mongoose';
import {UnionToIntersection} from 'type-fest';
import {
  EmailBlocklist,
  EmailBlocklistTrail,
  EmailMessage,
} from '../definitions/email.js';
import {ensureMongoTypeFields, resourceSchema} from './utils.js';

const emailMessageSchemaDef = ensureMongoTypeFields<EmailMessage>({
  ...resourceSchema,
  emailAddress: {type: [String]},
  userId: {type: [String]},
  workspaceId: {type: String},
  type: {type: String},
  params: {type: SchemaTypes.Map},
  sentAt: {type: Number},
  emailProvider: {type: String},
  meta: {type: SchemaTypes.Map},
});

export type EmailMessageDocument = Document<EmailMessage>;

const emailMessageSchema = new Schema<EmailMessage>(emailMessageSchemaDef);
const emailMessageModelName = 'email-entry';
const emailMessageCollectionName = 'email-entries';

export function getEmailMessageModel(connection: Connection) {
  const model = connection.model<EmailMessage>(
    emailMessageModelName,
    emailMessageSchema,
    emailMessageCollectionName
  );
  return model;
}

export type EmailMessageModel = Model<EmailMessage>;

const emailBlocklistTrailSchemaDef = ensureMongoTypeFields<
  UnionToIntersection<EmailBlocklistTrail>
>({
  trailType: {type: String},
  jobId: {type: String},
});
const emailBlocklistSchemaDef = ensureMongoTypeFields<EmailBlocklist>({
  ...resourceSchema,
  emailAddress: {type: String, index: true},
  reason: {type: String},
  trail: {type: emailBlocklistTrailSchemaDef},
});

export type EmailBlocklistDocument = Document<EmailBlocklist>;

const emailBlocklistSchema = new Schema<EmailBlocklist>(
  emailBlocklistSchemaDef
);
const emailBlocklistModelName = 'email-blocklist';
const emailBlocklistCollectionName = 'email-blocklists';

export function getEmailBlocklistModel(connection: Connection) {
  const model = connection.model<EmailBlocklist>(
    emailBlocklistModelName,
    emailBlocklistSchema,
    emailBlocklistCollectionName
  );
  return model;
}

export type EmailBlocklistModel = Model<EmailBlocklist>;
