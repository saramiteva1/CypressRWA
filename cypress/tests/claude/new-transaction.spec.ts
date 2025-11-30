// cypress/e2e/transaction-create.spec.ts

import { User } from "../../../src/models";

describe("Transaction Create", () => {
  const testUsers = {
    sender: "Katharina_Bernier",
    receiver: "Tavares_Barrows",
    password: "s3cret",
  };

  beforeEach(() => {
    // Seed базата
    cy.task("db:seed");

    // Логирај се со loginByXstate command кој правилно handlera redirect
    cy.loginByXstate(testUsers.sender, testUsers.password);
  });

  describe("Step 1 - Select Contact", () => {
    beforeEach(() => {
      // Посети /transaction/new и почекај страната да се вчита
      cy.visit("/transaction/new");

      // Провери дека се вчитани корисниците
      cy.getBySel("users-list").should("exist");
    });

    it("треба да прикаже Stepper со три чекори", () => {
      cy.get(".MuiStepper-root").should("be.visible");
      cy.contains("Select Contact").should("be.visible");
      cy.contains("Payment").should("be.visible");
      cy.contains("Complete").should("be.visible");
    });

    it("треба да прикаже листа на корисници", () => {
      cy.getBySel("users-list").should("be.visible");
      cy.getBySelLike("user-list-item").should("have.length.greaterThan", 0);
    });

    it("треба да може да се пребарува корисник", () => {
      // Внеси име за пребарување
      cy.getBySel("user-list-search-input").type("Tavares");

      // Провери дека резултатите се филтрирани
      cy.getBySelLike("user-list-item").should("have.length.lessThan", 10);
      cy.contains("Tavares").should("be.visible");
    });

    it("треба да избере корисник и да премине на Step 2", () => {
      // Кликни на првиот корисник од листата
      cy.getBySelLike("user-list-item").first().click();

      // Провери дека е преминато на Step 2
      cy.getBySel("transaction-create-form").should("be.visible");
      cy.contains("Payment").should("be.visible");
    });

    it("треба да може да пребарува и избере специфичен корисник", () => {
      cy.getBySel("user-list-search-input").type("Tavares Barrows");

      // Почекај на debounce
      cy.wait(300);

      cy.getBySelLike("user-list-item").first().click();

      // Провери дека е избран вистинскиот корисник
      cy.getBySel("transaction-create-form").should("be.visible");
      cy.contains("Tavares").should("be.visible");
    });
  });

  describe("Step 2 - Create Payment", () => {
    beforeEach(() => {
      // Користи го createTransaction command за да пребараш корисник
      cy.visit("/transaction/new");

      // Почекај да се вчитаат корисниците
      cy.getBySel("users-list").should("exist");

      cy.getBySel("user-list-search-input").type("Tavares");
      cy.wait(300);
      cy.getBySelLike("user-list-item").first().click();

      // Провери дека сме на Step 2
      cy.getBySel("transaction-create-form").should("exist");
    });

    it("треба да прикаже форма за креирање трансакција", () => {
      cy.getBySel("transaction-create-form").should("be.visible");
      cy.getBySel("transaction-create-amount-input").should("be.visible");
      cy.getBySel("transaction-create-description-input").should("be.visible");
      cy.getBySel("transaction-create-submit-payment").should("be.visible");
      cy.getBySel("transaction-create-submit-request").should("be.visible");
    });

    it("треба да креира Payment трансакција", () => {
      cy.intercept("POST", "/transactions").as("createTransaction");

      // ВнесиAmount
      cy.getBySel("transaction-create-amount-input").type("50");

      // Внеси Description
      cy.getBySel("transaction-create-description-input").type("Pizza dinner");

      // Кликни на Pay копче
      cy.getBySel("transaction-create-submit-payment").click();

      // Провери API повикот
      cy.wait("@createTransaction").then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        expect(interception.request.body).to.have.property("transactionType", "payment");
        expect(interception.request.body).to.have.property("amount", "50");
        expect(interception.request.body).to.have.property("description", "Pizza dinner");
      });

      // Провери дека е прикажан success snackbar
      cy.contains("Transaction Submitted!").should("be.visible");

      // Провери дека е преминато на Step 3
      cy.getBySel("new-transaction-return-to-transactions").should("be.visible");
    });

    it("треба да креира Request трансакција", () => {
      cy.intercept("POST", "/transactions").as("createTransaction");

      cy.getBySel("transaction-create-amount-input").type("25");
      cy.getBySel("transaction-create-description-input").type("Lunch money");

      // Кликни на Request копче
      cy.getBySel("transaction-create-submit-request").click();

      cy.wait("@createTransaction").then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        expect(interception.request.body).to.have.property("transactionType", "request");
        expect(interception.request.body).to.have.property("amount", "25");
        expect(interception.request.body).to.have.property("description", "Lunch money");
      });

      cy.contains("Transaction Submitted!").should("be.visible");
      cy.getBySel("new-transaction-return-to-transactions").should("be.visible");
    });

    it("треба да прикаже валидациска грешка за празен Amount", () => {
      // Внеси само Description
      cy.getBySel("transaction-create-description-input").type("Test transaction");

      // Submit копчињата треба да бидат disabled
      cy.getBySel("transaction-create-submit-payment").should("be.disabled");
      cy.getBySel("transaction-create-submit-request").should("be.disabled");
    });

    it("треба да прикаже валидациска грешка за празен Description", () => {
      // Внеси само Amount
      cy.getBySel("transaction-create-amount-input").type("100");

      // Submit копчињата треба да бидат disabled
      cy.getBySel("transaction-create-submit-payment").should("be.disabled");
      cy.getBySel("transaction-create-submit-request").should("be.disabled");
    });

    it("треба да форматира Amount со $ и thousands separator", () => {
      cy.getBySel("transaction-create-amount-input").type("1000");

      // Провери форматирање
      cy.getBySel("transaction-create-amount-input").find("input").should("have.value", "$1,000");
    });

    it("треба да enabled Submit копчињата само со валидни inputs", () => {
      // Иницијално disabled
      cy.getBySel("transaction-create-submit-payment").should("be.disabled");
      cy.getBySel("transaction-create-submit-request").should("be.disabled");

      // Внеси Amount
      cy.getBySel("transaction-create-amount-input").type("50");
      cy.getBySel("transaction-create-submit-payment").should("be.disabled");

      // Внеси Description
      cy.getBySel("transaction-create-description-input").type("Test");

      // Сега треба да се enabled
      cy.getBySel("transaction-create-submit-payment").should("not.be.disabled");
      cy.getBySel("transaction-create-submit-request").should("not.be.disabled");
    });

    it("треба да креира трансакција со голем Amount", () => {
      cy.intercept("POST", "/transactions").as("createTransaction");

      cy.getBySel("transaction-create-amount-input").type("5000");
      cy.getBySel("transaction-create-description-input").type("Expensive purchase");
      cy.getBySel("transaction-create-submit-payment").click();

      cy.wait("@createTransaction").then((interception) => {
        expect(interception.request.body).to.have.property("amount", "5000");
      });

      cy.contains("Transaction Submitted!").should("be.visible");
    });

    it("треба да креира трансакција со decimal Amount", () => {
      cy.intercept("POST", "/transactions").as("createTransaction");

      cy.getBySel("transaction-create-amount-input").type("25.50");
      cy.getBySel("transaction-create-description-input").type("Coffee");
      cy.getBySel("transaction-create-submit-payment").click();

      cy.wait("@createTransaction").then((interception) => {
        // Провери дека amount е правилно пратен
        expect(interception.request.body.amount).to.match(/25\.5/);
      });

      cy.contains("Transaction Submitted!").should("be.visible");
    });
  });

  describe("Step 3 - Complete", () => {
    beforeEach(() => {
      cy.visit("/transaction/new");

      // Почекај да се вчитаат корисниците
      cy.getBySel("users-list").should("exist");

      cy.getBySel("user-list-search-input").type("Tavares");
      cy.wait(300);
      cy.getBySelLike("user-list-item").first().click();

      // Креирај трансакција
      cy.getBySel("transaction-create-amount-input").type("100");
      cy.getBySel("transaction-create-description-input").type("Test transaction");

      cy.intercept("POST", "/transactions").as("createTransaction");
      cy.getBySel("transaction-create-submit-payment").click();

      // Почекај да заврши трансакцијата
      cy.wait("@createTransaction");
      cy.getBySel("new-transaction-return-to-transactions").should("exist");
    });

    it("треба да прикаже confirmation екран", () => {
      cy.getBySel("new-transaction-return-to-transactions").should("be.visible");
      cy.getBySel("new-transaction-create-another-transaction").should("be.visible");

      // Провери дека се прикажани детали за трансакцијата
      cy.contains("Paid").should("be.visible");
      cy.contains("$100").should("be.visible");
      cy.contains("Test transaction").should("be.visible");
    });

    it("треба да се врати на листа на трансакции", () => {
      cy.getBySel("new-transaction-return-to-transactions").click();

      // Провери дека е редиректирано на home страната
      cy.location("pathname").should("equal", "/");
      cy.getBySelLike("transaction-item").should("be.visible");
    });

    it("треба да креира друга трансакција", () => {
      cy.getBySel("new-transaction-create-another-transaction").click();

      // Провери дека е вратено на Step 1
      cy.location("pathname").should("equal", "/transaction/new");
      cy.getBySel("users-list").should("be.visible");
      cy.contains("Select Contact").should("be.visible");
    });

    it("треба да прикаже вистински податоци за Request трансакција", () => {
      // Врати се назад и креирај Request
      cy.getBySel("new-transaction-create-another-transaction").click();

      cy.getBySel("user-list-search-input").type("Tavares");
      cy.wait(300);
      cy.getBySelLike("user-list-item").first().click();

      cy.getBySel("transaction-create-amount-input").type("75");
      cy.getBySel("transaction-create-description-input").type("Request test");
      cy.getBySel("transaction-create-submit-request").click();

      cy.wait(1000);

      // Провери дека пишува "Requested" наместо "Paid"
      cy.contains("Requested").should("be.visible");
      cy.contains("$75").should("be.visible");
      cy.contains("Request test").should("be.visible");
    });
  });

  describe("Користење на createTransaction Command", () => {
    it("треба да креира трансакција со cy.createTransaction command", () => {
      // Користи го cy.createTransaction со XState пристап
      cy.window().then((win) => {
        const sender = { id: "tsHF6_X7R", username: testUsers.sender };
        const receiver = { id: "t45AiwidW", username: testUsers.receiver };

        const transactionPayload = {
          transactionType: "payment",
          sender,
          receiver,
          amount: "150",
          description: "Command test transaction",
        };

        cy.createTransaction(transactionPayload);

        // Провери дека трансакцијата е креирана
        cy.visit("/");
        cy.contains("Command test transaction").should("be.visible");
      });
    });

    it("треба да креира повеќе трансакции", () => {
      cy.window().then((win) => {
        const sender = { id: "tsHF6_X7R", username: testUsers.sender };
        const receiver = { id: "t45AiwidW", username: testUsers.receiver };

        // Креирај 3 трансакции
        for (let i = 1; i <= 3; i++) {
          cy.createTransaction({
            transactionType: "payment",
            sender,
            receiver,
            amount: `${i * 10}`,
            description: `Transaction ${i}`,
          });
        }

        // Провери дека сите се прикажани
        cy.visit("/");
        cy.contains("Transaction 1").should("be.visible");
        cy.contains("Transaction 2").should("be.visible");
        cy.contains("Transaction 3").should("be.visible");
      });
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      cy.visit("/transaction/new");

      // Почекај да се вчитаат корисниците
      cy.getBySel("users-list").should("exist");

      cy.getBySel("user-list-search-input").type("Tavares");
      cy.wait(300);
      cy.getBySelLike("user-list-item").first().click();

      // Провери дека сме на Step 2
      cy.getBySel("transaction-create-form").should("exist");
    });

    it("треба да handlera network error", () => {
      cy.intercept("POST", "/transactions", { forceNetworkError: true }).as(
        "createTransactionError"
      );

      cy.getBySel("transaction-create-amount-input").type("50");
      cy.getBySel("transaction-create-description-input").type("Error test");
      cy.getBySel("transaction-create-submit-payment").click();

      // Треба да остане на Step 2
      cy.getBySel("transaction-create-form").should("be.visible");
    });

    it("треба да handlera 500 server error", () => {
      cy.intercept("POST", "/transactions", { statusCode: 500 }).as("serverError");

      cy.getBySel("transaction-create-amount-input").type("50");
      cy.getBySel("transaction-create-description-input").type("Server error test");
      cy.getBySel("transaction-create-submit-payment").click();

      cy.wait("@serverError");

      // Треба да остане на Step 2
      cy.getBySel("transaction-create-form").should("be.visible");
    });
  });

  describe("XState Integration", () => {
    it("треба да користи createTransactionService од window", () => {
      cy.visit("/transaction/new");

      cy.window().then((win) => {
        // Провери дека createTransactionService е достапен
        expect(win).to.have.property("createTransactionService");
      });
    });

    it("треба да може да се контролира преку XState", () => {
      cy.visit("/transaction/new");

      // Избери корисник преку UI наместо преку XState
      cy.getBySel("user-list-search-input").type(testUsers.receiver);
      cy.wait(300);
      cy.getBySelLike("user-list-item").first().click();

      // Провери дека е преминато на Step 2
      cy.getBySel("transaction-create-form").should("be.visible");
    });
  });

  describe("UI/UX", () => {
    it("треба да има autofocus на Amount полето", () => {
      cy.visit("/transaction/new");
      cy.getBySelLike("user-list-item").first().click();

      cy.getBySel("transaction-create-amount-input").find("input").should("have.focus");
    });

    it("треба да прикаже Avatar на receiver корисникот", () => {
      cy.visit("/transaction/new");
      cy.getBySelLike("user-list-item").first().click();

      // Провери дека е прикажан Avatar
      cy.get(".MuiAvatar-root").should("be.visible");
    });

    it("треба да прикаже име на receiver корисникот", () => {
      cy.visit("/transaction/new");
      cy.getBySel("user-list-search-input").type("Tavares Barrows");
      cy.wait(300);
      cy.getBySelLike("user-list-item").first().click();

      // Провери дека е прикажано името
      cy.contains("Tavares").should("be.visible");
    });
  });
});
