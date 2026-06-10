sap.ui.define([
  "sap/m/Dialog",
  "sap/m/VBox",
  "sap/m/Label",
  "sap/m/Input",
  "sap/m/TextArea",
  "sap/m/Select",
  "sap/ui/core/Item",
  "sap/m/Button",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (
  Dialog,
  VBox,
  Label,
  Input,
  TextArea,
  Select,
  Item,
  Button,
  MessageToast,
  MessageBox
) {
  "use strict";

  const SERVICE_URL = "/odata/v4/helpdesk/";

  async function getCsrfToken() {
    const response = await fetch(SERVICE_URL, {
      method: "GET",
      credentials: "include",
      headers: {
        "X-CSRF-Token": "Fetch"
      }
    });

    return response.headers.get("x-csrf-token") || response.headers.get("X-CSRF-Token");
  }

  async function loadCategories(oCategorySelect) {
    const response = await fetch(SERVICE_URL + "TicketCategories?$select=ID,name", {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Unable to load ticket categories");
    }

    const data = await response.json();
    const categories = data.value || [];

    oCategorySelect.removeAllItems();

    categories.forEach(function (category) {
      oCategorySelect.addItem(new Item({
        key: category.ID,
        text: category.name || category.ID
      }));
    });
  }

  async function createTicket(payload) {
    const csrfToken = await getCsrfToken();

    const response = await fetch(SERVICE_URL + "createTicket", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-CSRF-Token": csrfToken
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorText = await response.text();

      try {
        const errorJson = JSON.parse(errorText);
        errorText = errorJson.error && errorJson.error.message
          ? errorJson.error.message
          : errorText;
      } catch (e) {
        // keep original error text
      }

      throw new Error(errorText || "Ticket creation failed");
    }

    return response.json();
  }

  return {
    open: async function () {
      const oTitleInput = new Input({
        placeholder: "Example: Laptop not working",
        maxLength: 120,
        width: "100%"
      });

      const oDescriptionInput = new TextArea({
        placeholder: "Describe the issue in detail",
        rows: 5,
        width: "100%"
      });

      const oPrioritySelect = new Select({
        width: "100%",
        items: [
          new Item({ key: "LOW", text: "Low" }),
          new Item({ key: "MEDIUM", text: "Medium" }),
          new Item({ key: "HIGH", text: "High" })
        ],
        selectedKey: "MEDIUM"
      });

      const oCategorySelect = new Select({
        width: "100%"
      });

      const oDialog = new Dialog({
        title: "Create Ticket",
        contentWidth: "500px",
        content: [
          new VBox({
            width: "100%",
            class: "sapUiSmallMargin",
            items: [
              new Label({ text: "Title", required: true }),
              oTitleInput,

              new Label({ text: "Description", required: true }).addStyleClass("sapUiSmallMarginTop"),
              oDescriptionInput,

              new Label({ text: "Priority", required: true }).addStyleClass("sapUiSmallMarginTop"),
              oPrioritySelect,

              new Label({ text: "Category", required: true }).addStyleClass("sapUiSmallMarginTop"),
              oCategorySelect
            ]
          })
        ],
        beginButton: new Button({
          text: "Create",
          type: "Emphasized",
          press: async function () {
            try {
              const title = oTitleInput.getValue().trim();
              const description = oDescriptionInput.getValue().trim();
              const priority = oPrioritySelect.getSelectedKey();
              const category_ID = oCategorySelect.getSelectedKey();

              if (!title) {
                MessageBox.error("Title is mandatory");
                return;
              }

              if (!description) {
                MessageBox.error("Description is mandatory");
                return;
              }

              if (!category_ID) {
                MessageBox.error("Category is mandatory");
                return;
              }

              await createTicket({
                title: title,
                description: description,
                priority: priority,
                category_ID: category_ID
              });

              MessageToast.show("Ticket created successfully");

              oDialog.close();
              oDialog.destroy();

              setTimeout(function () {
                window.location.reload();
              }, 800);
            } catch (error) {
              MessageBox.error(error.message || "Ticket creation failed");
            }
          }
        }),
        endButton: new Button({
          text: "Cancel",
          press: function () {
            oDialog.close();
            oDialog.destroy();
          }
        })
      });

      try {
        await loadCategories(oCategorySelect);
        oDialog.open();
      } catch (error) {
        oDialog.destroy();
        MessageBox.error(error.message || "Unable to open Create Ticket form");
      }
    }
  };
});
