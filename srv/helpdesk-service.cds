using { helpdesk.ai as db } from '../db/schema';

service HelpdeskService @(path: '/odata/v4/helpdesk') {

  entity Users as projection on db.Users;
  entity Departments as projection on db.Departments;
  entity TicketCategories as projection on db.TicketCategories;
  entity Tickets as projection on db.Tickets;
  entity TicketComments as projection on db.TicketComments;
  entity KnowledgeArticles as projection on db.KnowledgeArticles;
  entity AIRecommendations as projection on db.AIRecommendations;
  entity AuditLogs as projection on db.AuditLogs;
}