/// <reference types="cypress" />

Cypress.on("uncaught:exception", () => {
  // Prevent failing tests if app throws React/XState errors
  return false;
});

describe("Create Transaction Flow", () => {
  beforeEach(() => {
    // 1) Login with a valid seeded username
    cy.loginByXstate("Devon_Becker");

    // 2) Assert UI logged-in state BEFORE continuing
    cy.getBySel("sidenav-username").should("contain", "Devon");

    // 3) Navigate to create transaction form
    cy.visit("/transaction/new");

    // 4) Required intercepts for backend validation
    cy.intercept("GET", "/users*").as("getUsers");
    cy.intercept("POST", "/transactions").as("createTransaction");
  });

  it("should select a receiver, fill transaction form and PAY successfully", () => {
    // Step 1: Wait for contacts
    cy.wait("@getUsers");

    // Select first available user from list
    cy.getBySelLike("user-list-item").first().click();

    // Step 2: Fill out the transaction form
    cy.getBySel("transaction-create-amount-input").type("45");
    cy.getBySel("transaction-create-description-input").type("Dinner");

    // Submit as a PAYMENT
    cy.getBySel("transaction-create-submit-payment").click();

    // Backend payload assertion
    cy.wait("@createTransaction").then(({ request }) => {
      expect(request.body.transactionType).to.equal("payment");
      expect(request.body.amount).to.equal("45");
      expect(request.body.description).to.equal("Dinner");
      expect(request.body.senderId).to.exist;
      expect(request.body.receiverId).to.exist;
    });

    // Step 3: Confirmation UI
    cy.contains(/Paid/i).should("be.visible");
    cy.contains(/Dinner/).should("be.visible");
    cy.getBySel("new-transaction-return-to-transactions").should("be.visible");
  });

  it("should create REQUEST transaction successfully", () => {
    cy.wait("@getUsers");

    cy.getBySelLike("user-list-item").eq(2).click();

    cy.getBySel("transaction-create-amount-input").type("175");
    cy.getBySel("transaction-create-description-input").type("Concert tickets");

    cy.getBySel("transaction-create-submit-request").click();

    cy.wait("@createTransaction").then(({ request }) => {
      expect(request.body.transactionType).to.equal("request");
      expect(request.body.amount).to.equal("175");
      expect(request.body.description).to.equal("Concert tickets");
    });

    cy.contains(/Requested/i).should("be.visible");
    cy.contains(/Concert tickets/).should("be.visible");
  });
});
