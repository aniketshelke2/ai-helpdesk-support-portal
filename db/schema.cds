namespace helpdesk.ai;

using {
  cuid,
  managed
} from '@sap/cds/common';

entity Users : cuid, managed {
  userName     : String(100);
  email        : String(120);
  role         : String(30);    // EMPLOYEE, SUPPORT_AGENT, MANAGER, ADMIN
  department   : Association to Departments;
  status       : String(20) default 'ACTIVE';
  loginId      : String(60);
}

entity Departments : cuid, managed {
  name         : String(80);
  description  : String(250);
  users        : Composition of many Users
                   on users.department = $self;
}

entity TicketCategories : cuid, managed {
  name          : String(80);
  description   : String(250);
  defaultPriority : String(20); // LOW, MEDIUM, HIGH, CRITICAL
}

entity Tickets : cuid, managed {
  ticketNo       : String(30);
  title          : String(150);
  description    : String(1000);

  createdByUser  : Association to Users;
  assignedToUser : Association to Users;
  category       : Association to TicketCategories;

  priority       : String(20);  // LOW, MEDIUM, HIGH, CRITICAL
  status         : String(30);  // OPEN, IN_PROGRESS, RESOLVED, CLOSED, REOPENED
  source         : String(30);  // PORTAL, EMAIL, CHATBOT
  dueDate        : Date;
  resolvedAt     : DateTime;

  comments       : Composition of many TicketComments
                     on comments.ticket = $self;

  aiRecommendations : Composition of many AIRecommendations
                        on aiRecommendations.ticket = $self;

    auditLogs : Composition of many AuditLogs
                on auditLogs.ticket = $self;
}

entity TicketComments : cuid, managed {
  ticket       : Association to Tickets;
  commentedBy : Association to Users;
  commentText  : String(1000);
  commentType  : String(30); // USER_COMMENT, AGENT_REPLY, INTERNAL_NOTE
}

entity KnowledgeArticles : cuid, managed {
  articleNo     : String(30);
  title         : String(150);
  content       : String(2000);
  category      : Association to TicketCategories;
  tags          : String(250);
  status        : String(20); // DRAFT, PUBLISHED, ARCHIVED
}

entity AIRecommendations : cuid, managed {
  ticket             : Association to Tickets;
  suggestedCategory  : Association to TicketCategories;
  suggestedPriority  : String(20);
  suggestedSolution  : String(1000);
  confidenceScore    : Decimal(5,2);
  recommendationType : String(40); // CATEGORY, PRIORITY, SOLUTION, SUMMARY
  status             : String(20) default 'NEW'; // NEW, ACCEPTED, REJECTED
}

entity AuditLogs : cuid, managed {
  ticket        : Association to Tickets;
  objectType    : String(50);   // TICKET, COMMENT, AI_RECOMMENDATION
  objectId      : String(50);
  action        : String(80);   // CREATED, ASSIGNED, STATUS_CHANGED, RESOLVED
  performedBy   : Association to Users;
  oldValue      : String(250);
  newValue      : String(250);
  remarks       : String(500);
}