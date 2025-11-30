describe("User Login", () => {
  beforeEach(() => {
    cy.visit("/signin"); // или /login ако таков ви е route-от
  });

  it("should login successfully with valid credentials", () => {
    // Intercept backend request (optional but recommended for stability)
    cy.intercept("POST", "/login").as("loginRequest");

    cy.get('[data-test="signin-username"]').type("testuser");
    cy.get('[data-test="signin-password"]').type("test1234");
    cy.get('[data-test="signin-submit"]').click();

    cy.wait("@loginRequest").its("response.statusCode").should("eq", 200);

    // Проверка дека user е логираниот (redirect или auth check)
    cy.url().should("not.include", "/signin"); // пример: не треба да остане на login page
  });

  it("should show an error message when credentials are invalid", () => {
    cy.intercept("POST", "/login").as("loginRequest");

    cy.get('[data-test="signin-username"]').type("invalidUser");
    cy.get('[data-test="signin-password"]').type("wrongPass");
    cy.get('[data-test="signin-submit"]').click();

    cy.wait("@loginRequest");

    // Проверка за порака
    cy.get('[data-test="signin-error"]')
      .should("be.visible")
      .and("contain.text", "Incorrect username or password.");
  });

  it("should set remember me cookie when user checks Remember me", () => {
    cy.intercept("POST", "/login").as("loginRequest");

    cy.get('[data-test="signin-username"]').type("testuser");
    cy.get('[data-test="signin-password"]').type("test1234");
    cy.get('[data-test="signin-remember-me"]').click();
    cy.get('[data-test="signin-submit"]').click();

    cy.wait("@loginRequest");

    // Проверка cookie - express session cookie `connect.sid` треба да постои
    cy.getCookie("connect.sid").should("exist");
  });
});
