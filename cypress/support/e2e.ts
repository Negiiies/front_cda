// cypress/support/e2e.ts
import './commands'

// Gestion des erreurs non critiques
Cypress.on('uncaught:exception', (err, runnable) => {
  // Erreurs à ignorer (communes avec Next.js et React)
  const ignoredErrors = [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'Loading CSS chunk',
    'ChunkLoadError',
    'Loading chunk',
    'Script error'
  ]
  
  for (const ignoredError of ignoredErrors) {
    if (err.message.includes(ignoredError)) {
      return false
    }
  }
  
  // Log l'erreur pour debugging
  console.error('Uncaught exception:', err.message)
  
  return true
})

// Configuration globale avant chaque test
beforeEach(() => {
  // Commentez cette ligne si le backend n'est pas encore démarré
  // cy.waitForAPI()
  
  // Intercepter les erreurs 401 pour éviter les échecs de test
  cy.intercept('POST', '**/auth/**', (req) => {
    req.continue((res) => {
      if (res.statusCode === 401) {
        // Log pour debugging
        cy.task('log', `Auth failed: ${res.body?.message || 'Unauthorized'}`)
      }
    })
  })
})

// Configuration après chaque test
afterEach(() => {
  // Nettoyer les cookies et tokens si nécessaire
  cy.clearCookies()
})