import EndpointReusableQueries from '../queries';

export default abstract class ProgramAccessTokenQueries {
  static getByOrganizationId = EndpointReusableQueries.getByOrganizationId;
  static getById = EndpointReusableQueries.getById;
  static getByIds = EndpointReusableQueries.getByIdsAndOrgId;
}
