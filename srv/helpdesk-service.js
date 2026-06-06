const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
  const {
  Users,
  Tickets,
  TicketCategories,
  AIRecommendations,
  AuditLogs
} = this.entities;

  async function addAuditLog({
    ticketID,
    ticketNo,
    objectType = 'TICKET',
    action,
    oldValue = '',
    newValue = '',
    remarks = ''
  }) {
    await INSERT.into(AuditLogs).entries({
      ticket_ID: ticketID,
      objectType,
      objectId: ticketNo || ticketID,
      action,
      oldValue,
      newValue,
      remarks
    });
  }


  function hasAnyRole(req, roles) {
    return roles.some((role) => req.user.is(role));
  }

  function requireAnyRole(req, roles, actionName) {
    if (!hasAnyRole(req, roles)) {
      return req.reject(
        403,
        `You are not authorized to perform action: ${actionName}`
      );
    }
  }

  this.on('getCurrentUserInfo', async (req) => {
  return {
    userId: req.user.id,
    isEmployee: req.user.is('Employee'),
    isSupportAgent: req.user.is('SupportAgent'),
    isManager: req.user.is('Manager'),
    isAdmin: req.user.is('Admin')
  };
});


  this.before('READ', 'Tickets', async (req) => {
  if (
    req.user.is('Employee') &&
    !hasAnyRole(req, ['SupportAgent', 'Manager', 'Admin'])
  ) {
        const appUser = await getCurrentAppUser(req);

        if (!appUser) {
          return req.reject(403, 'Application user mapping not found.');
        }

        req.query.where({
          createdByUser_ID: appUser.ID
        });
      }
    });

this.before('READ', 'AuditLogs', async (req) => {
  if (!hasAnyRole(req, ['SupportAgent', 'Manager', 'Admin'])) {
    return req.reject(403, 'Only Support Agent, Manager or Admin can view audit logs.');
  }
});

  async function getCurrentAppUser(req) {
    return await SELECT.one.from(Users).where({
      loginId: req.user.id
    });
  }

  this.on('startProgress', 'Tickets', async (req) => {
    requireAnyRole(req, ['SupportAgent', 'Manager', 'Admin'], 'Start Progress');
    const ID = req.params[0].ID;

    const ticket = await SELECT.one.from(Tickets).where({ ID });

    if (!ticket) {
      return req.error(404, 'Ticket not found');
    }

    if (ticket.status !== 'OPEN' && ticket.status !== 'REOPENED') {
      return req.error(
        400,
        `Only OPEN or REOPENED tickets can be moved to IN_PROGRESS. Current status: ${ticket.status}`
      );
    }

    await UPDATE(Tickets)
      .set({ status: 'IN_PROGRESS' })
      .where({ ID });

    await addAuditLog({
      ticketID: ID,
      ticketNo: ticket.ticketNo,
      action: 'STATUS_CHANGED',
      oldValue: ticket.status,
      newValue: 'IN_PROGRESS',
      remarks: 'Ticket moved to In Progress'
    });

    return await SELECT.one.from(Tickets).where({ ID });
  });

  this.on('resolveTicket', 'Tickets', async (req) => {
    requireAnyRole(req, ['SupportAgent', 'Manager', 'Admin'], 'Resolve Ticket');
    const ID = req.params[0].ID;

    const ticket = await SELECT.one.from(Tickets).where({ ID });

    if (!ticket) {
      return req.error(404, 'Ticket not found');
    }

    if (ticket.status !== 'IN_PROGRESS') {
      return req.error(
        400,
        `Only IN_PROGRESS tickets can be resolved. Current status: ${ticket.status}`
      );
    }

    await UPDATE(Tickets)
      .set({
        status: 'RESOLVED',
        resolvedAt: new Date().toISOString()
      })
      .where({ ID });

    await addAuditLog({
      ticketID: ID,
      ticketNo: ticket.ticketNo,
      action: 'RESOLVED',
      oldValue: ticket.status,
      newValue: 'RESOLVED',
      remarks: 'Ticket resolved by support agent'
    });

    return await SELECT.one.from(Tickets).where({ ID });
  });

  this.on('reopenTicket', 'Tickets', async (req) => {
    requireAnyRole(req, ['Employee', 'SupportAgent', 'Manager', 'Admin'], 'Reopen Ticket');
    const ID = req.params[0].ID;

    const ticket = await SELECT.one.from(Tickets).where({ ID });

    if (!ticket) {
      return req.error(404, 'Ticket not found');
    }

    if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
      return req.error(
        400,
        `Only RESOLVED or CLOSED tickets can be reopened. Current status: ${ticket.status}`
      );
    }

    await UPDATE(Tickets)
      .set({
        status: 'REOPENED',
        resolvedAt: null
      })
      .where({ ID });

    await addAuditLog({
      ticketID: ID,
      ticketNo: ticket.ticketNo,
      action: 'REOPENED',
      oldValue: ticket.status,
      newValue: 'REOPENED',
      remarks: 'Ticket reopened by user'
    });

    return await SELECT.one.from(Tickets).where({ ID });
  });

  this.on('generateAIRecommendation', 'Tickets', async (req) => {

    requireAnyRole(req, ['SupportAgent', 'Manager', 'Admin'], 'Generate AI Recommendation');
    const ID = req.params[0].ID;

    const ticket = await SELECT.one.from(Tickets).where({ ID });

    if (!ticket) {
      return req.error(404, 'Ticket not found');
    }

    if (ticket.status === 'CLOSED') {
      return req.error(400, 'AI recommendation cannot be generated for CLOSED tickets.');
    }

    const existingNewRecommendation = await SELECT.one
      .from(AIRecommendations)
      .where({
        ticket_ID: ID,
        recommendationType: 'SOLUTION',
        status: 'NEW'
      });

    if (existingNewRecommendation) {
      req.warn(
        409,
        'A NEW AI recommendation already exists for this ticket. No new recommendation was generated.'
      );

      return existingNewRecommendation;
    }

    const text = `${ticket.title || ''} ${ticket.description || ''}`.toLowerCase();

    let categoryName = 'Software Issue';
    let priority = 'MEDIUM';
    let solution =
      'AI suggests checking the application logs, restarting the application, and contacting support if the issue continues.';
    let confidence = 75.00;

    if (text.includes('login') || text.includes('password') || text.includes('portal')) {
      categoryName = 'Login Issue';
      priority = 'HIGH';
      solution =
        'AI suggests clearing browser cache, verifying the portal URL, checking account lock status, and resetting the password if needed.';
      confidence = 91.50;
    } else if (text.includes('vpn') || text.includes('network') || text.includes('internet')) {
      categoryName = 'Network Issue';
      priority = 'HIGH';
      solution =
        'AI suggests checking internet connectivity, restarting VPN client, verifying MFA, and testing with an alternate network.';
      confidence = 88.00;
    } else if (
      text.includes('laptop') ||
      text.includes('slow') ||
      text.includes('printer') ||
      text.includes('hardware')
    ) {
      categoryName = 'Hardware Issue';
      priority = 'MEDIUM';
      solution =
        'AI suggests restarting the device, checking disk space, disabling unwanted startup apps, and running hardware diagnostics.';
      confidence = 84.00;
    }

    const category = await SELECT.one.from(TicketCategories).where({ name: categoryName });

    if (!category) {
      return req.error(404, `Category not found: ${categoryName}`);
    }

    const recommendation = {
      ticket_ID: ID,
      suggestedCategory_ID: category.ID,
      suggestedPriority: priority,
      suggestedSolution: solution,
      confidenceScore: confidence,
      recommendationType: 'SOLUTION',
      status: 'NEW'
    };

    await INSERT.into(AIRecommendations).entries(recommendation);

    await addAuditLog({
      ticketID: ID,
      ticketNo: ticket.ticketNo,
      objectType: 'AI_RECOMMENDATION',
      action: 'GENERATED',
      oldValue: '',
      newValue: priority,
      remarks: `Mock AI recommendation generated for ${categoryName}`
    });

    return await SELECT.one
      .from(AIRecommendations)
      .where({
        ticket_ID: ID,
        recommendationType: 'SOLUTION',
        status: 'NEW'
      })
      .orderBy('createdAt desc');
  });

  this.on('generateAISummary', 'Tickets', async (req) => {
    requireAnyRole(req, ['SupportAgent', 'Manager', 'Admin'], 'Generate AI Summary');

    const ID = req.params[0].ID;

    const ticket = await SELECT.one.from(Tickets).where({ ID });

    if (!ticket) {
      return req.error(404, 'Ticket not found');
    }

    const existingNewSummary = await SELECT.one
      .from(AIRecommendations)
      .where({
        ticket_ID: ID,
        recommendationType: 'SUMMARY',
        status: 'NEW'
      });

    if (existingNewSummary) {
      return existingNewSummary;
    }

    const comments = await SELECT.from('HelpdeskService.TicketComments')
      .where({
        ticket_ID: ID
      })
      .orderBy('createdAt asc');

    let summaryText = `AI Summary: Ticket ${ticket.ticketNo} is about "${ticket.title}". Current status is ${ticket.status}, priority is ${ticket.priority}.`;

    if (comments && comments.length > 0) {
      summaryText += ` There are ${comments.length} comment(s). Latest update: ${comments[comments.length - 1].commentText}`;
    } else {
      summaryText += ' No ticket comments are available yet.';
    }

    await INSERT.into(AIRecommendations).entries({
      ticket_ID: ID,
      suggestedPriority: ticket.priority,
      suggestedSolution: summaryText,
      confidenceScore: 82.00,
      recommendationType: 'SUMMARY',
      status: 'NEW'
    });

    await addAuditLog({
      ticketID: ID,
      ticketNo: ticket.ticketNo,
      objectType: 'AI_RECOMMENDATION',
      action: 'SUMMARY_GENERATED',
      oldValue: '',
      newValue: 'SUMMARY',
      remarks: 'Mock AI summary generated for ticket'
    });

    return await SELECT.one
      .from(AIRecommendations)
      .where({
        ticket_ID: ID,
        recommendationType: 'SUMMARY',
        status: 'NEW'
      })
      .orderBy('createdAt desc');
  });

  this.on('acceptRecommendation', 'AIRecommendations', async (req) => {
    requireAnyRole(req, ['SupportAgent', 'Manager', 'Admin'], 'Accept AI Recommendation');
    const recommendationID = req.params[req.params.length - 1].ID;

    if (!recommendationID) {
      return req.error(400, 'AI recommendation ID not found in request.');
    }

    const recommendation = await SELECT.one.from(AIRecommendations).where({
      ID: recommendationID
    });

    if (!recommendation) {
      return req.error(404, 'AI recommendation not found');
    }

    if (recommendation.status === 'ACCEPTED') {
      return req.error(400, 'This recommendation is already accepted.');
    }

    if (recommendation.status === 'REJECTED') {
      return req.error(400, 'Rejected recommendation cannot be accepted.');
    }

    const ticket = await SELECT.one.from(Tickets).where({
      ID: recommendation.ticket_ID
    });

    if (!ticket) {
      return req.error(404, 'Related ticket not found');
    }

    if (recommendation.recommendationType === 'SOLUTION') {
      await UPDATE(Tickets)
        .set({
          priority: recommendation.suggestedPriority,
          category_ID: recommendation.suggestedCategory_ID
        })
        .where({
          ID: recommendation.ticket_ID
        });
    }

    await UPDATE(AIRecommendations)
      .set({
        status: 'ACCEPTED'
      })
      .where({
        ID: recommendationID
      });

    await addAuditLog({
      ticketID: recommendation.ticket_ID,
      ticketNo: ticket.ticketNo,
      objectType: 'AI_RECOMMENDATION',
      action: 'ACCEPTED',
      oldValue: ticket.priority,
      newValue: recommendation.suggestedPriority,
      remarks:
        recommendation.recommendationType === 'SOLUTION'
          ? 'AI recommendation accepted and ticket priority/category updated'
          : 'AI summary accepted'
    });

    return await SELECT.one.from(AIRecommendations).where({
      ID: recommendationID
    });
  });

  this.on('rejectRecommendation', 'AIRecommendations', async (req) => {
    requireAnyRole(req, ['SupportAgent', 'Manager', 'Admin'], 'Reject AI Recommendation');
    const recommendationID = req.params[req.params.length - 1].ID;

    if (!recommendationID) {
      return req.error(400, 'AI recommendation ID not found in request.');
    }

    const recommendation = await SELECT.one.from(AIRecommendations).where({
      ID: recommendationID
    });

    if (!recommendation) {
      return req.error(404, 'AI recommendation not found');
    }

    if (recommendation.status === 'ACCEPTED') {
      return req.error(400, 'Accepted recommendation cannot be rejected.');
    }

    if (recommendation.status === 'REJECTED') {
      return req.error(400, 'This recommendation is already rejected.');
    }

    await UPDATE(AIRecommendations)
      .set({
        status: 'REJECTED'
      })
      .where({
        ID: recommendationID
      });

    const ticket = await SELECT.one.from(Tickets).where({
      ID: recommendation.ticket_ID
    });

    await addAuditLog({
      ticketID: recommendation.ticket_ID,
      ticketNo: ticket ? ticket.ticketNo : recommendation.ticket_ID,
      objectType: 'AI_RECOMMENDATION',
      action: 'REJECTED',
      oldValue: recommendation.status,
      newValue: 'REJECTED',
      remarks: 'AI recommendation rejected by support agent'
    });

    return await SELECT.one.from(AIRecommendations).where({
      ID: recommendationID
    });
  });
});