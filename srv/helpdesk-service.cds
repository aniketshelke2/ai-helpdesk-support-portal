using { helpdesk.ai as db } from '../db/schema';

service HelpdeskService @(path: '/odata/v4/helpdesk') {

  type CurrentUserInfo {
  userId         : String;
  isEmployee    : Boolean;
  isSupportAgent: Boolean;
  isManager     : Boolean;
  isAdmin       : Boolean;
}











annotate HelpdeskService.Tickets with actions {
  generateAIRecommendation @Common.SideEffects: {
    TargetEntities: [
      aiRecommendations,
      auditLogs
    ]
  };

  generateAISummary @Common.SideEffects: {
    TargetEntities: [
      aiRecommendations,
      auditLogs
    ]
  };

  startProgress @Common.SideEffects: {
    TargetEntities: [
      auditLogs
    ],
    TargetProperties: [
      status,
      resolvedAt
    ]
  };

  resolveTicket @Common.SideEffects: {
    TargetEntities: [
      auditLogs
    ],
    TargetProperties: [
      status,
      resolvedAt
    ]
  };

  reopenTicket @Common.SideEffects: {
    TargetEntities: [
      auditLogs
    ],
    TargetProperties: [
      status,
      resolvedAt
    ]
  };
};












 entity Users as projection on db.Users;
entity Departments as projection on db.Departments;
entity TicketCategories as projection on db.TicketCategories;


  @requires: 'Employee'
  action createTicket(
    title       : String(120),
    description : LargeString,
    category_ID : UUID,
    priority    : String(20)
  ) returns Tickets;

@requires: 'authenticated-user'
function getCurrentUserInfo() returns {
  userId         : String;
  isEmployee     : Boolean;
  isSupportAgent : Boolean;
  isManager      : Boolean;
  isAdmin        : Boolean;
};

  @requires: 'authenticated-user'
  function getDashboardKpis() returns {
    totalTickets      : Integer;
    openTickets       : Integer;
    inProgressTickets : Integer;
    resolvedTickets   : Integer;
    highPriority      : Integer;
    mediumPriority    : Integer;
    lowPriority       : Integer;
    portalTickets     : Integer;
    emailTickets      : Integer;
  };

  @restrict: [
    {
      grant: 'READ',
      to: ['Employee', 'SupportAgent', 'Manager', 'Admin']
    },
    {
      grant: 'CREATE',
      to: ['Employee', 'SupportAgent', 'Manager', 'Admin']
    },
    {
      grant: ['UPDATE', 'DELETE'],
      to: ['SupportAgent', 'Manager', 'Admin']
    },
    {
      grant: ['startProgress', 'resolveTicket', 'generateAIRecommendation', 'generateAISummary'],
      to: ['SupportAgent', 'Manager', 'Admin']
    },
    {
      grant: 'reopenTicket',
      to: ['Employee', 'SupportAgent', 'Manager', 'Admin']
    },
    
  ]
  entity Tickets as projection on db.Tickets actions {
    action startProgress() returns Tickets;
    action resolveTicket() returns Tickets;
    action reopenTicket() returns Tickets;
    action generateAIRecommendation() returns AIRecommendations;
    action generateAISummary() returns AIRecommendations;
  };

  entity TicketComments as projection on db.TicketComments;
  entity KnowledgeArticles as projection on db.KnowledgeArticles;

  @restrict: [
    {
      grant: 'READ',
      to: ['Employee', 'SupportAgent', 'Manager', 'Admin']
    },
    {
      grant: ['acceptRecommendation', 'rejectRecommendation'],
      to: ['SupportAgent', 'Manager', 'Admin']
    }
  ]
  entity AIRecommendations as projection on db.AIRecommendations actions {
    action acceptRecommendation() returns AIRecommendations;
    action rejectRecommendation() returns AIRecommendations;
  };

  @restrict: [
    {
      grant: 'READ',
      to: ['SupportAgent', 'Manager', 'Admin']
    }
  ]
  entity AuditLogs as projection on db.AuditLogs;
}

annotate HelpdeskService.Tickets with @(
  Capabilities.InsertRestrictions: {
    Insertable: true
  }
);

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




annotate HelpdeskService.AIRecommendations with actions {
  acceptRecommendation @Common.SideEffects: {
    TargetProperties: [
      status
    ]
  };

  rejectRecommendation @Common.SideEffects: {
    TargetProperties: [
      status
    ]
  };
};



annotate HelpdeskService.Tickets with {
  ID              @UI.Hidden;
  createdAt       @UI.Hidden;
  createdBy       @UI.Hidden;
  modifiedAt      @UI.Hidden;
  modifiedBy      @UI.Hidden;

  ticketNo        @Core.Computed;
  status          @Core.Computed;
  source          @Core.Computed;
  dueDate         @Core.Computed;
  resolvedAt      @Core.Computed;

  
};


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