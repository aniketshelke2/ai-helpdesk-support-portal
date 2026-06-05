sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"helpdesk/ticket/tickets/test/integration/pages/TicketsList",
	"helpdesk/ticket/tickets/test/integration/pages/TicketsObjectPage"
], function (JourneyRunner, TicketsList, TicketsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('helpdesk/ticket/tickets') + '/test/flp.html#app-preview',
        pages: {
			onTheTicketsList: TicketsList,
			onTheTicketsObjectPage: TicketsObjectPage
        },
        async: true
    });

    return runner;
});

