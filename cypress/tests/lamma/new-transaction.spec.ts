// cypress/integration/transaction_create_spec.js

describe("Transaction Creation Flow", () => {
  // Променете ја базната URL до вашата апликација
  const baseUrl = "http://localhost:3000";

  beforeEach(() => {
    cy.visit(`${baseUrl}/transaction/new`); // Страницата за креирање трансакција
  });

  it("инитира и завршува цел процес на креирање на трансакција", () => {
    // *** Степен 1: Избор и пребарување контакти ***
    // Пронаоѓа корисник во листата и го селектира
    cy.get('[data-test="user-search-input"]').type("John");
    cy.wait(300); // Чека за debounce
    cy.get('[data-test="user-list-item"]').first().click();

    // Проверка дека е избран receiver
    cy.window()
      .its("createTransactionService")
      .then((service) => {
        // Recall the context
        cy.wrap(service).its("state.context.receiver").should("exist");
      });

    // Следна стъпка
    cy.get('[data-test="next-step-button"]').click();

    // *** Степен 2: Внесување детали за трансакцијата ***
    // Внесување износ
    cy.get('[data-test="transaction-create-amount-input"]').type("100");

    // Внесување белешка
    cy.get('[data-test="transaction-create-description-input"]').type("Test Transaction");

    // Клик за "Request"
    cy.get('[data-test="transaction-create-submit-request"]').click();

    // Проверка дека се прикажа потврда
    cy.get('[data-test="snackbar-success"]')
      .should("be.visible")
      .and("contain", "Transaction Submitted!");

    // Следна стъпка (автоматски се префрла / или рачно)
    // За да се ја симулира префрлувањето
    cy.get('[data-test="next-step-button"]').click();

    // *** Степен 3: Потврда ***
    // Проверка ако е прикажано
    cy.get('[data-test="transaction-step-three"]').should("be.visible");

    // Проверка на деталите
    cy.get('[data-test="transaction-summary"]')
      .should("contain", "100")
      .and("contain", "Test Transaction");

    // Клик на "Create Another Transaction" за нов процес
    cy.get('[data-test="new-transaction-create-another-transaction"]').click();

    // Проверка дека е враќање на почетната страница или форма
    cy.url().should("include", "/transaction/new");
  });
});
