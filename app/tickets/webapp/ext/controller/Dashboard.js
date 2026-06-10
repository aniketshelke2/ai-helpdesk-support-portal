sap.ui.define([
  "sap/m/Dialog",
  "sap/m/VBox",
  "sap/m/HBox",
  "sap/m/GenericTile",
  "sap/m/TileContent",
  "sap/m/NumericContent",
  "sap/m/Button",
  "sap/m/MessageBox"
], function (
  Dialog,
  VBox,
  HBox,
  GenericTile,
  TileContent,
  NumericContent,
  Button,
  MessageBox
) {
  "use strict";

  const SERVICE_URL = "/odata/v4/helpdesk/";

  async function loadDashboardKpis() {
    const response = await fetch(SERVICE_URL + "getDashboardKpis()", {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Unable to load dashboard KPIs");
    }

    return response.json();
  }

  function createTile(title, value, subtitle) {
    return new GenericTile({
      header: title,
      subheader: subtitle || "",
      frameType: "OneByOne",
      tileContent: [
        new TileContent({
          content: new NumericContent({
            value: String(value),
            truncateValueTo: 6
          })
        })
      ]
    }).addStyleClass("sapUiTinyMargin");
  }

  return {
    open: async function () {
      try {
        const data = await loadDashboardKpis();

        const oDialog = new Dialog({
          title: "Helpdesk Dashboard",
          contentWidth: "760px",
          contentHeight: "520px",
          resizable: true,
          draggable: true,
          content: [
            new VBox({
              class: "sapUiSmallMargin",
              items: [
                new HBox({
                  wrap: "Wrap",
                  items: [
                    createTile("Total Tickets", data.totalTickets, "All tickets"),
                    createTile("Open", data.openTickets, "Open tickets"),
                    createTile("In Progress", data.inProgressTickets, "Being handled"),
                    createTile("Resolved", data.resolvedTickets, "Completed")
                  ]
                }),
                new HBox({
                  wrap: "Wrap",
                  items: [
                    createTile("High Priority", data.highPriority, "Urgent tickets"),
                    createTile("Medium Priority", data.mediumPriority, "Normal tickets"),
                    createTile("Low Priority", data.lowPriority, "Low impact")
                  ]
                }),
                new HBox({
                  wrap: "Wrap",
                  items: [
                    createTile("Portal Tickets", data.portalTickets, "Created from portal"),
                    createTile("Email Tickets", data.emailTickets, "Created from email")
                  ]
                })
              ]
            })
          ],
          endButton: new Button({
            text: "Close",
            press: function () {
              oDialog.close();
              oDialog.destroy();
            }
          })
        });

        oDialog.open();
      } catch (error) {
        MessageBox.error(error.message || "Dashboard loading failed");
      }
    }
  };
});
