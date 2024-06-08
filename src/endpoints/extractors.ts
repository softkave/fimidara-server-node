import {
  PublicAgent,
  PublicResource,
  PublicWorkspaceResource,
} from '../definitions/system.js';
import {
  ExtractFieldsFrom,
  getFields,
  makeExtract,
  makeExtractIfPresent,
  makeListExtract,
} from '../utils/extract.js';

const agentPublicFields = getFields<PublicAgent>({
  agentId: true,
  agentType: true,
});

export const agentExtractor = makeExtract(agentPublicFields);
export const agentExtractorIfPresent = makeExtractIfPresent(agentPublicFields);
export const agentListExtractor = makeListExtract(agentPublicFields);

export const resourceFields: ExtractFieldsFrom<PublicResource> = {
  resourceId: true,
  createdAt: true,
  lastUpdatedAt: true,
  isDeleted: true,
  deletedAt: true,
  createdBy: agentExtractorIfPresent,
  lastUpdatedBy: agentExtractorIfPresent,
  deletedBy: agentExtractorIfPresent,
};
export const workspaceResourceFields: ExtractFieldsFrom<PublicWorkspaceResource> = {
  ...resourceFields,
  workspaceId: true,
  createdBy: agentExtractor,
  lastUpdatedBy: agentExtractor,
};

export const resourceExtractor = makeExtract(getFields<PublicResource>(resourceFields));
export const resourceListExtractor = makeListExtract(
  getFields<PublicResource>(resourceFields)
);
export const workspaceResourceExtractor = makeExtract(
  getFields<PublicWorkspaceResource>(workspaceResourceFields)
);
export const workspaceResourceListExtractor = makeListExtract(
  getFields<PublicWorkspaceResource>(workspaceResourceFields)
);
