// cypress/integration/signin_spec.js

describe("Sign In Form", () => {
  const baseUrl = "http://localhost:3000"; // Заменете со вашата URL адреса ако е различна

  beforeEach(() => {
    cy.visit(`${baseUrl}/signin`); // Заменете со вистинскиот пат до страницата за логирање
  });

  it("should successfully log in a user with correct credentials", () => {
    // Внесете коректни податоци за тест пример
    cy.get('[data-test="signin-username"]').type("correctUsername");
    cy.get('[data-test="signin-password"]').type("correctPassword");

    // Опција: можеби сакате да активирате "remember" по избор
    // cy.get('[data-test="signin-remember-me"]').check();

    // Кликнете на "Sign In" копчето
    cy.get('[data-test="signin-submit"]').click();

    // Проверете дали се аплицира некаква авторизација или пренасочување
    // Пример: очекувањето да се префрлите на dashboard или да има одредена порака
    // Можно е да проверите дека корисникот е логирани
    // Овде поставете реална чекорја од вашиот апликативен тест
    cy.url().should("not.include", "/signin"); // Пример: да се префрлите од на страницата за логирање
    // или
    // cy.get('body').should('contain', 'Welcome');
  });

  it("should show an error message on incorrect credentials", () => {
    // Внесете непостоечки или грешни податоци
    cy.get('[data-test="signin-username"]').type("wrongUser");
    cy.get('[data-test="signin-password"]').type("wrongPassword");

    cy.get('[data-test="signin-submit"]').click();

    // Проверете дали се прикажува порака за грешка
    cy.get('[data-test="signin-error"]')
      .should("be.visible")
      .and("contain", "Incorrect username or password.");
  });

  it("should disable submit button when form is invalid", () => {
    // Не внесувајте ниту еден дел од формата
    // Проверете дали копчето е деактивирано
    cy.get('[data-test="signin-username"]').clear();
    cy.get('[data-test="signin-password"]').clear();

    // Копчето треба да биде disabled
    cy.get('[data-test="signin-submit"]').should("be.disabled");
  });
});
