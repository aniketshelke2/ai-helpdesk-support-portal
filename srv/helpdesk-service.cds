using { helpdesk.ai as db } from '../db/schema';

@requires: 'authenticated-user'
service HelpdeskService @(path: '/odata/v4/helpdesk') {

  entity Users as projection on db.Users;
  entity Departments as projection on db.Departments;
  entity TicketCategories as projection on db.TicketCategories;
  entity Tickets as projection on db.Tickets actions {
    action startProgress() returns Tickets;
    action resolveTicket() returns Tickets;
    action reopenTicket() returns Tickets;
    action generateAIRecommendation() returns AIRecommendations;
    action generateAISummary() returns AIRecommendations;
  };
  entity TicketComments as projection on db.TicketComments;
  entity KnowledgeArticles as projection on db.KnowledgeArticles;
  entity AIRecommendations as projection on db.AIRecommendations actions {
  action acceptRecommendation() returns AIRecommendations;
  action rejectRecommendation() returns AIRecommendations;
};
  entity AuditLogs as projection on db.AuditLogs;
}

annotate HelpdeskService.Tickets with @(
  UI: {
    HeaderInfo: {
      TypeName: 'Ticket',
      TypeNamePlural: 'Tickets',
      Title: {
        Value: ticketNo
      },
      Description: {
        Value: title
      }
    },

    SelectionFields: [
      ticketNo,
      priority,
      status,
      source
    ],

    LineItem: [
      {
        Value: ticketNo,
        Label: 'Ticket No'
      },
      {
        Value: title,
        Label: 'Title'
      },
      {
        Value: priority,
        Label: 'Priority'
      },
      {
        Value: status,
        Label: 'Status'
      },
      {
        Value: source,
        Label: 'Source'
      },
      {
        Value: dueDate,
        Label: 'Due Date'
      }
    ],

      Facets: [
        {
          $Type: 'UI.ReferenceFacet',
          Label: 'Ticket Details',
          Target: '@UI.FieldGroup#TicketDetails'
        },
        {
          $Type: 'UI.ReferenceFacet',
          Label: 'Ticket Comments',
          Target: 'comments/@UI.LineItem'
        },
        {
          $Type: 'UI.ReferenceFacet',
          Label: 'AI Recommendations',
          Target: 'aiRecommendations/@UI.LineItem'
        },
        {
          $Type: 'UI.ReferenceFacet',
          Label: 'Audit Logs',
          Target: 'auditLogs/@UI.LineItem'
        }
      ],

    Identification: [
      {
        $Type: 'UI.DataFieldForAction',
        Action: 'HelpdeskService.startProgress',
        Label: 'Start Progress'
      },
      {
        $Type: 'UI.DataFieldForAction',
        Action: 'HelpdeskService.resolveTicket',
        Label: 'Resolve Ticket'
      },
      {
        $Type: 'UI.DataFieldForAction',
        Action: 'HelpdeskService.reopenTicket',
        Label: 'Reopen Ticket'
      },
      {
        $Type: 'UI.DataFieldForAction',
        Action: 'HelpdeskService.generateAIRecommendation',
        Label: 'Generate AI Recommendation'
      },
      {
        $Type: 'UI.DataFieldForAction',
        Action: 'HelpdeskService.generateAIRecommendation',
        Label: 'Generate AI Recommendation'
      },
      {
        $Type: 'UI.DataFieldForAction',
        Action: 'HelpdeskService.generateAISummary',
        Label: 'Generate AI Summary'
      }
    ],

    FieldGroup #TicketDetails: {
      Data: [
        {
          Value: ticketNo,
          Label: 'Ticket No'
        },
        {
          Value: title,
          Label: 'Title'
        },
        {
          Value: description,
          Label: 'Description'
        },
        {
          Value: priority,
          Label: 'Priority'
        },
        {
          Value: status,
          Label: 'Status'
        },
        {
          Value: source,
          Label: 'Source'
        },
        {
          Value: dueDate,
          Label: 'Due Date'
        },
        {
          Value: resolvedAt,
          Label: 'Resolved At'
        }
      ]
    }
  }
);

annotate HelpdeskService.TicketComments with @(
  UI: {
    LineItem: [
      {
        Value: commentText,
        Label: 'Comment'
      },
      {
        Value: commentType,
        Label: 'Comment Type'
      },
      {
        Value: createdAt,
        Label: 'Created At'
      },
      {
        Value: createdBy,
        Label: 'Created By'
      }
    ]
  }
);

annotate HelpdeskService.AIRecommendations with @(
  UI: {
    LineItem: [
      {
        Value: suggestedPriority,
        Label: 'Suggested Priority'
      },
      {
        Value: suggestedSolution,
        Label: 'Suggested Solution'
      },
      {
        Value: confidenceScore,
        Label: 'Confidence Score'
      },
      {
        Value: recommendationType,
        Label: 'Recommendation Type'
      },
      {
        Value: status,
        Label: 'Status'
      },
      {
        $Type: 'UI.DataFieldForAction',
        Action: 'HelpdeskService.acceptRecommendation',
        Label: 'Accept'
      },
      {
        $Type: 'UI.DataFieldForAction',
        Action: 'HelpdeskService.rejectRecommendation',
        Label: 'Reject'
      }
    ]
  }
);

annotate HelpdeskService.KnowledgeArticles with @(
  UI: {
    HeaderInfo: {
      TypeName: 'Knowledge Article',
      TypeNamePlural: 'Knowledge Articles',
      Title: {
        Value: articleNo
      },
      Description: {
        Value: title
      }
    },

    LineItem: [
      {
        Value: articleNo,
        Label: 'Article No'
      },
      {
        Value: title,
        Label: 'Title'
      },
      {
        Value: tags,
        Label: 'Tags'
      },
      {
        Value: status,
        Label: 'Status'
      }
    ]
  }
);


