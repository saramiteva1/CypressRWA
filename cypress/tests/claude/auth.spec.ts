// cypress/e2e/signin.spec.ts

import { User } from "../../../src/models/user";

describe("User Sign In", () => {
  beforeEach(() => {
    // Seed базата со тест податоци
    cy.task("db:seed");

    // Посети ја страната за најава
    cy.visit("/signin");
  });

  describe("Успешна најава", () => {
    it("треба да се најави корисник со валидни credentials", () => {
      // Користи го постоечкиот seed корисник
      const username = "Katharina_Bernier";
      const password = "s3cret";

      // Intercept на login и checkAuth API повици
      cy.intercept("POST", "/login").as("loginUser");
      cy.intercept("GET", "/checkAuth").as("checkAuth");

      // Внеси username
      cy.getBySel("signin-username").type(username);

      // Внеси password
      cy.getBySel("signin-password").type(password);

      // Кликни на Submit копче
      cy.getBySel("signin-submit").click();

      // Почекај на успешен login response
      cy.wait("@loginUser").then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        expect(interception.response?.body.user).to.have.property("id");
        expect(interception.response?.body.user.username).to.equal(username);
      });

      // Провери дека корисникот е редиректиран
      cy.location("pathname").should("not.equal", "/signin");
      cy.location("pathname").should("equal", "/");
    });

    it("треба да се најави со Remember Me опција", () => {
      const username = "Katharina_Bernier";
      const password = "s3cret";

      cy.intercept("POST", "/login").as("loginUser");

      cy.getBySel("signin-username").type(username);
      cy.getBySel("signin-password").type(password);

      // Штиклирај Remember Me
      cy.getBySel("signin-remember-me").find("input").check();
      cy.getBySel("signin-remember-me").find("input").should("be.checked");

      cy.getBySel("signin-submit").click();

      cy.wait("@loginUser").then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        // Провери дека remember flag е пратен
        expect(interception.request.body).to.have.property("remember");
      });

      cy.location("pathname").should("equal", "/");
    });

    it("треба да се најави користејќи го custom login command", () => {
      const username = "Katharina_Bernier";
      const password = "s3cret";

      // Користи го постоечкиот cy.login() command
      cy.login(username, password);

      // Провери дека е успешно најавен
      cy.location("pathname").should("equal", "/");

      // Провери username во sidenav
      cy.getBySel("sidenav-username").contains(username);
    });

    it("треба да се најави користејќи XState command", () => {
      const username = "Katharina_Bernier";
      const password = "s3cret";

      // Користи го cy.loginByXstate() command
      cy.loginByXstate(username, password);

      // Провери дека е најавен
      cy.location("pathname").should("equal", "/");
      cy.getBySel("list-skeleton").should("not.exist");
    });
  });

  describe("Валидација на форма", () => {
    it("треба да прикаже error за празен username", () => {
      // Внеси само password
      cy.getBySel("signin-password").type("s3cret");

      // Submit копчето треба да биде disabled
      cy.getBySel("signin-submit").should("be.disabled");
    });

    it("треба да прикаже error за празен password", () => {
      // Внеси само username
      cy.getBySel("signin-username").type("Katharina_Bernier");

      // Submit копчето треба да биде disabled
      cy.getBySel("signin-submit").should("be.disabled");
    });

    it("треба да прикаже error за кратка лозинка (помалку од 4 карактери)", () => {
      cy.getBySel("signin-username").type("Katharina_Bernier");
      cy.getBySel("signin-password").type("123");

      // Blur за да се активира валидацијата
      cy.getBySel("signin-username").click();

      // Провери за error message
      cy.contains("Password must contain at least 4 characters").should("be.visible");

      // Submit копчето треба да биде disabled
      cy.getBySel("signin-submit").should("be.disabled");
    });

    it("треба да прикаже error за задолжително поле username", () => {
      // Focus и blur без да се внесе нешто
      cy.getBySel("signin-username").focus();
      cy.getBySel("signin-username").blur();

      // Провери за error message
      cy.contains("Username is required").should("be.visible");
    });

    it("треба да прикаже error за задолжително поле password", () => {
      cy.getBySel("signin-username").type("Katharina_Bernier");
      cy.getBySel("signin-password").focus();
      cy.getBySel("signin-password").blur();

      // Провери за error message
      cy.contains("Enter your password").should("be.visible");
    });

    it("треба да го enabled Submit копчето само со валидни inputs", () => {
      // Иницијално копчето е disabled
      cy.getBySel("signin-submit").should("be.disabled");

      // Внеси само username
      cy.getBySel("signin-username").type("Katharina_Bernier");
      cy.getBySel("signin-submit").should("be.disabled");

      // Внеси валиден password
      cy.getBySel("signin-password").type("s3cret");

      // Сега копчето треба да е enabled
      cy.getBySel("signin-submit").should("not.be.disabled");
    });
  });

  describe("Неуспешна најава", () => {
    it("треба да прикаже error за невалиден username", () => {
      cy.intercept("POST", "/login").as("loginUser");

      cy.getBySel("signin-username").type("nonexistentuser");
      cy.getBySel("signin-password").type("wrongpassword");
      cy.getBySel("signin-submit").click();

      // Почекај на failed login response
      cy.wait("@loginUser").then((interception) => {
        expect(interception.response?.statusCode).to.equal(401);
      });

      // Провери дека се прикажува error пораката
      cy.getBySel("signin-error").should("be.visible");
      cy.getBySel("signin-error").contains("Incorrect username or password");
    });

    it("треба да прикаже error за невалиден password", () => {
      cy.intercept("POST", "/login").as("loginUser");

      cy.getBySel("signin-username").type("Katharina_Bernier");
      cy.getBySel("signin-password").type("wrongpassword123");
      cy.getBySel("signin-submit").click();

      cy.wait("@loginUser").then((interception) => {
        expect(interception.response?.statusCode).to.equal(401);
      });

      // Провери дека се прикажува error пораката
      cy.getBySel("signin-error").should("be.visible");
      cy.getBySel("signin-error").contains("Incorrect username or password");
    });

    it("треба да остане на signin страната по неуспешна најава", () => {
      cy.intercept("POST", "/login").as("loginUser");

      cy.getBySel("signin-username").type("invaliduser");
      cy.getBySel("signin-password").type("invalidpass");
      cy.getBySel("signin-submit").click();

      cy.wait("@loginUser");

      // Провери дека корисникот останува на signin страната
      cy.location("pathname").should("equal", "/signin");
    });
  });

  describe("Навигација", () => {
    it("треба да редиректира кон Sign Up страната", () => {
      cy.getBySel("signup").click();
      cy.location("pathname").should("equal", "/signup");
    });

    it("треба да прикаже Sign In наслов", () => {
      cy.contains("h1", "Sign in").should("be.visible");
    });

    it("треба да прикаже RWA Logo", () => {
      cy.get("svg").should("be.visible");
    });
  });

  describe("Тестирање со повеќе корисници", () => {
    it("треба да се најават повеќе различни корисници", () => {
      // Најди 3 различни корисници од базата
      const usernames = ["Katharina_Bernier", "Tavares_Barrows", "Allie2"];

      usernames.forEach((username, index) => {
        cy.visit("/signin");
        cy.intercept("POST", "/login").as(`loginUser${index}`);

        cy.database("find", "users", { username }).then((user: User) => {
          cy.getBySel("signin-username").type(user.username);
          cy.getBySel("signin-password").type("s3cret");
          cy.getBySel("signin-submit").click();

          cy.wait(`@loginUser${index}`).then((interception) => {
            expect(interception.response?.statusCode).to.equal(200);
            expect(interception.response?.body.user.username).to.equal(user.username);
          });

          cy.location("pathname").should("equal", "/");

          // Logout за следниот тест
          cy.logoutByXstate();
        });
      });
    });
  });

  describe("Remember Me функционалност", () => {
    it("треба да го зачува checkbox state", () => {
      // Провери дека checkbox не е штиклиран
      cy.getBySel("signin-remember-me").find("input").should("not.be.checked");

      // Штиклирај го
      cy.getBySel("signin-remember-me").find("input").check();
      cy.getBySel("signin-remember-me").find("input").should("be.checked");

      // Одштиклирај го
      cy.getBySel("signin-remember-me").find("input").uncheck();
      cy.getBySel("signin-remember-me").find("input").should("not.be.checked");
    });
  });

  describe("API интеграција", () => {
    it("треба да провери checkAuth по успешна најава", () => {
      const username = "Katharina_Bernier";
      const password = "s3cret";

      cy.intercept("POST", "/login").as("loginUser");
      cy.intercept("GET", "/checkAuth").as("checkAuth");

      cy.getBySel("signin-username").type(username);
      cy.getBySel("signin-password").type(password);
      cy.getBySel("signin-submit").click();

      cy.wait("@loginUser");
      cy.wait("@checkAuth").then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        expect(interception.response?.body.user).to.have.property("id");
      });
    });

    it("треба да handleра network errors", () => {
      cy.intercept("POST", "/login", { forceNetworkError: true }).as("loginError");

      cy.getBySel("signin-username").type("Katharina_Bernier");
      cy.getBySel("signin-password").type("s3cret");
      cy.getBySel("signin-submit").click();

      // Треба да остане на signin страната
      cy.location("pathname").should("equal", "/signin");
    });
  });

  describe("Accessibility", () => {
    it("треба да има autofocus на username полето", () => {
      cy.getBySel("signin-username").should("have.focus");
    });

    it("треба да може да се submitне со Enter", () => {
      cy.intercept("POST", "/login").as("loginUser");

      cy.getBySel("signin-username").type("Katharina_Bernier");
      cy.getBySel("signin-password").type("s3cret{enter}");

      cy.wait("@loginUser").then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
      });
    });
  });
});
