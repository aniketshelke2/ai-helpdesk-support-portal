const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
  const { Tickets, TicketCategories, AIRecommendations, AuditLogs } = this.entities;

  this.on('startProgress', 'Tickets', async (req) => {
    const ID = req.params[0].ID;

    const ticket = await SELECT.one.from(Tickets).where({ ID });

    if (!ticket) {
      return req.error(404, 'Ticket not found');
    }

    if (ticket.status !== 'OPEN' && ticket.status !== 'REOPENED') {
      return req.error(400, `Only OPEN or REOPENED tickets can be moved to IN_PROGRESS. Current status: ${ticket.status}`);
    }

    await UPDATE(Tickets)
      .set({ status: 'IN_PROGRESS' })
      .where({ ID });

    await INSERT.into(AuditLogs).entries({
      objectType: 'TICKET',
      objectId: ticket.ticketNo,
      action: 'STATUS_CHANGED',
      oldValue: ticket.status,
      newValue: 'IN_PROGRESS',
      remarks: 'Ticket moved to In Progress'
    });

    return await SELECT.one.from(Tickets).where({ ID });
  });

  this.on('resolveTicket', 'Tickets', async (req) => {
    const ID = req.params[0].ID;

    const ticket = await SELECT.one.from(Tickets).where({ ID });

    if (!ticket) {
      return req.error(404, 'Ticket not found');
    }

    if (ticket.status !== 'IN_PROGRESS') {
      return req.error(400, `Only IN_PROGRESS tickets can be resolved. Current status: ${ticket.status}`);
    }

    await UPDATE(Tickets)
      .set({
        status: 'RESOLVED',
        resolvedAt: new Date().toISOString()
      })
      .where({ ID });

    await INSERT.into(AuditLogs).entries({
      objectType: 'TICKET',
      objectId: ticket.ticketNo,
      action: 'RESOLVED',
      oldValue: ticket.status,
      newValue: 'RESOLVED',
      remarks: 'Ticket resolved by support agent'
    });

    return await SELECT.one.from(Tickets).where({ ID });
  });

  this.on('reopenTicket', 'Tickets', async (req) => {
    const ID = req.params[0].ID;

    const ticket = await SELECT.one.from(Tickets).where({ ID });

    if (!ticket) {
      return req.error(404, 'Ticket not found');
    }

    if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
      return req.error(400, `Only RESOLVED or CLOSED tickets can be reopened. Current status: ${ticket.status}`);
    }

    await UPDATE(Tickets)
      .set({
        status: 'REOPENED',
        resolvedAt: null
      })
      .where({ ID });

    await INSERT.into(AuditLogs).entries({
      objectType: 'TICKET',
      objectId: ticket.ticketNo,
      action: 'REOPENED',
      oldValue: ticket.status,
      newValue: 'REOPENED',
      remarks: 'Ticket reopened by user'
    });

    return await SELECT.one.from(Tickets).where({ ID });
  });

    this.on('generateAIRecommendation', 'Tickets', async (req) => {
    const ID = req.params[0].ID;

    const ticket = await SELECT.one.from(Tickets).where({ ID });

    if (!ticket) {
      return req.error(404, 'Ticket not found');
    }

    const text = `${ticket.title || ''} ${ticket.description || ''}`.toLowerCase();

    let categoryName = 'Software Issue';
    let priority = 'MEDIUM';
    let solution = 'AI suggests checking the application logs, restarting the application, and contacting support if the issue continues.';
    let confidence = 75.00;

    if (text.includes('login') || text.includes('password') || text.includes('portal')) {
      categoryName = 'Login Issue';
      priority = 'HIGH';
      solution = 'AI suggests clearing browser cache, verifying the portal URL, checking account lock status, and resetting the password if needed.';
      confidence = 91.50;
    } else if (text.includes('vpn') || text.includes('network') || text.includes('internet')) {
      categoryName = 'Network Issue';
      priority = 'HIGH';
      solution = 'AI suggests checking internet connectivity, restarting VPN client, verifying MFA, and testing with an alternate network.';
      confidence = 88.00;
    } else if (text.includes('laptop') || text.includes('slow') || text.includes('printer') || text.includes('hardware')) {
      categoryName = 'Hardware Issue';
      priority = 'MEDIUM';
      solution = 'AI suggests restarting the device, checking disk space, disabling unwanted startup apps, and running hardware diagnostics.';
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

    await INSERT.into(AuditLogs).entries({
      objectType: 'AI_RECOMMENDATION',
      objectId: ticket.ticketNo,
      action: 'GENERATED',
      oldValue: '',
      newValue: priority,
      remarks: `Mock AI recommendation generated for ${categoryName}`
    });

    return await SELECT.one.from(AIRecommendations)
      .where({
        ticket_ID: ID,
        status: 'NEW'
      })
      .orderBy('createdAt desc');
  });

  this.on('acceptRecommendation', 'AIRecommendations', async (req) => {
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

  await UPDATE(Tickets)
    .set({
      priority: recommendation.suggestedPriority,
      category_ID: recommendation.suggestedCategory_ID
    })
    .where({
      ID: recommendation.ticket_ID
    });

  await UPDATE(AIRecommendations)
    .set({
      status: 'ACCEPTED'
    })
    .where({
      ID: recommendationID
    });

  await INSERT.into(AuditLogs).entries({
    objectType: 'AI_RECOMMENDATION',
    objectId: ticket.ticketNo,
    action: 'ACCEPTED',
    oldValue: ticket.priority,
    newValue: recommendation.suggestedPriority,
    remarks: 'AI recommendation accepted and ticket priority/category updated'
  });

  return await SELECT.one.from(AIRecommendations).where({
    ID: recommendationID
  });
});




this.on('rejectRecommendation', 'AIRecommendations', async (req) => {
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

  await INSERT.into(AuditLogs).entries({
    objectType: 'AI_RECOMMENDATION',
    objectId: ticket ? ticket.ticketNo : recommendation.ticket_ID,
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