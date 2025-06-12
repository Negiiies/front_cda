// cypress/e2e/basic.cy.ts
describe('Tests de Base - Application 89 Progress', () => {
    it('vérifie que l\'application se charge', () => {
      // Aller à la racine d'abord
      cy.visit('/')
      
      // Vérifier qu'on a bien l'application 89 Progress
      cy.contains('89 Progress', { timeout: 10000 }).should('be.visible')
      
      // Logger l'URL actuelle pour debug
      cy.url().then((url) => {
        cy.task('log', `URL actuelle: ${url}`)
      })
    })
  
    it('trouve la page de connexion', () => {
      // Tester différentes routes possibles pour la connexion
      cy.visit('/', { failOnStatusCode: false })
      
      // Si on est redirigé vers login, parfait
      cy.url().then((url) => {
        if (url.includes('login')) {
          cy.contains('89 Progress').should('be.visible')
          cy.get('input[type="email"]').should('be.visible')
          cy.get('input[type="password"]').should('be.visible')
        } else {
          // Sinon, chercher un lien ou bouton de connexion
          cy.get('body').then(($body) => {
            if ($body.text().includes('Connexion') || $body.text().includes('Login') || $body.text().includes('Se connecter')) {
              cy.contains(/Connexion|Login|Se connecter/i).click()
              cy.get('input[type="email"]').should('be.visible')
            } else {
              // Essayer la route /login directement
              cy.visit('/login', { failOnStatusCode: false })
              cy.get('input[type="email"]').should('be.visible')
            }
          })
        }
      })
    })
  
    it('affiche les éléments de base de l\'interface', () => {
      cy.visit('/', { failOnStatusCode: false })
      
      // Chercher des éléments communs de votre app
      cy.get('body').should('contain.text', '89 Progress')
      
      // Vérifier qu'il y a du contenu (pas une page vide)
      cy.get('body').should('not.be.empty')
    })
  })