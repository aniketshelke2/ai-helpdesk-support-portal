const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
  const { Tickets, AuditLogs } = this.entities;

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
});