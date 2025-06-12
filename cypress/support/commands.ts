// cypress/support/commands.ts

// Déclaration des types AVANT les implémentations
declare global {
    namespace Cypress {
      interface Chainable {
        login(email: string, password: string): Chainable<void>
        loginAsTeacher(): Chainable<void>
        loginAsStudent(): Chainable<void>
        loginAsAdmin(): Chainable<void>
        waitForAPI(): Chainable<void>
        clearTokens(): Chainable<void>
      }
    }
  }
  
  // Commande pour attendre que le backend soit prêt
  Cypress.Commands.add('waitForAPI', () => {
    const backendUrl = Cypress.env('BACKEND_URL') || 'http://localhost:3000'
    
    cy.request({
      url: `${backendUrl}/health`,
      method: 'GET',
      failOnStatusCode: false,
      timeout: 10000,
      retryOnStatusCodeFailure: true
    }).then((response) => {
      if (response.status !== 200) {
        cy.wait(1000)
        cy.waitForAPI()
      }
    })
  })
  
  // Commande pour nettoyer les tokens
  Cypress.Commands.add('clearTokens', () => {
    cy.window().then((win) => {
      win.localStorage.removeItem('accessToken')
      win.localStorage.removeItem('refreshToken')
    })
  })
  
  // Commande de connexion principale
  Cypress.Commands.add('login', (email: string, password: string) => {
    cy.session([email, password], () => {
      // Nettoyer d'abord
      cy.clearTokens()
      
      // Aller à la page de connexion
      cy.visit('/login')
      
      // Attendre que la page soit chargée
      cy.get('input[type="email"]', { timeout: 10000 }).should('be.visible')
      
      // Remplir le formulaire
      cy.get('input[type="email"]').clear().type(email)
      cy.get('input[type="password"]').clear().type(password)
      
      // Soumettre
      cy.get('button[type="submit"]').click()
      
      // Attendre la redirection
      cy.url({ timeout: 10000 }).should('include', '/dashboard')
      
      // Vérifier qu'on est bien connecté
      cy.window().then((win) => {
        expect(win.localStorage.getItem('accessToken')).to.not.be.null
      })
    })
  })
  
  // Commandes de connexion par rôle
  Cypress.Commands.add('loginAsTeacher', () => {
    cy.login(Cypress.env('TEACHER_EMAIL'), Cypress.env('TEACHER_PASSWORD'))
  })
  
  Cypress.Commands.add('loginAsStudent', () => {
    cy.login(Cypress.env('STUDENT_EMAIL'), Cypress.env('STUDENT_PASSWORD'))
  })
  
  Cypress.Commands.add('loginAsAdmin', () => {
    cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'))
  })
  
  // Export pour éviter l'erreur de module
  export {}