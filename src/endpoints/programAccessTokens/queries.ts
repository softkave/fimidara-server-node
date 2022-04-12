import EndpointReusableQueries from '../queries';

export default abstract class ProgramAccessTokenQueries {
  static getByWorkspaceId = EndpointReusableQueries.getByWorkspaceId;
  static getById = EndpointReusableQueries.getById;
  static getByIds = EndpointReusableQueries.getByIdsAndWorkspaceId;
}
