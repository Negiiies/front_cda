// cypress/support/index.d.ts
/// <reference types="cypress" />

declare namespace Cypress {
    interface Chainable {
      /**
       * Connexion utilisateur avec email et mot de passe
       * @param email - Email de l'utilisateur
       * @param password - Mot de passe de l'utilisateur
       */
      login(email: string, password: string): Chainable<void>
      
      /**
       * Connexion en tant que professeur
       */
      loginAsTeacher(): Chainable<void>
      
      /**
       * Connexion en tant qu'étudiant
       */
      loginAsStudent(): Chainable<void>
      
      /**
       * Connexion en tant qu'administrateur
       */
      loginAsAdmin(): Chainable<void>
      
      /**
       * Attendre que l'API backend soit disponible
       */
      waitForAPI(): Chainable<void>
      
      /**
       * Nettoyer les tokens d'authentification
       */
      clearTokens(): Chainable<void>
    }
  }