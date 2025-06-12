// cypress/e2e/adaptive.cy.ts
describe('Tests adaptatifs - 89 Progress', () => {
    it('découvre la structure de votre app', () => {
      cy.visit('/')
      
      // Logger ce qu'on voit réellement
      cy.get('body').then(($body) => {
        const bodyText = $body.text()
        cy.task('log', `Contenu de la page: ${bodyText.substring(0, 200)}...`)
      })
      
      // Vérifier les éléments communs d'une SPA
      cy.get('body').should('not.be.empty')
      
      // Chercher des indices de votre application
      cy.get('body').then(($body) => {
        const text = $body.text().toLowerCase()
        
        if (text.includes('progress') || text.includes('89')) {
          cy.task('log', '✅ Application 89 Progress détectée!')
        }
        
        if (text.includes('login') || text.includes('connexion')) {
          cy.task('log', '✅ Éléments de connexion détectés!')
        }
        
        if (text.includes('email') || text.includes('password')) {
          cy.task('log', '✅ Champs de formulaire détectés!')
        }
      })
    })
  
    it('trouve et teste les champs de saisie disponibles', () => {
      cy.visit('/')
      
      // Chercher tous les inputs disponibles
      cy.get('input').then(($inputs) => {
        cy.task('log', `Nombre d'inputs trouvés: ${$inputs.length}`)
        
        // Utiliser cy.wrap et .each() pour itérer correctement
        if ($inputs.length > 0) {
          cy.wrap($inputs).each(($input, index) => {
            const type = $input.attr('type') || 'text'
            const placeholder = $input.attr('placeholder') || 'no placeholder'
            cy.task('log', `Input ${index}: type="${type}", placeholder="${placeholder}"`)
          })
        }
      })
      
      // Si on trouve des inputs, les tester
      cy.get('body').then(($body) => {
        if ($body.find('input[type="email"]').length > 0) {
          cy.get('input[type="email"]').should('be.visible')
          cy.task('log', '✅ Champ email trouvé')
        }
        
        if ($body.find('input[type="password"]').length > 0) {
          cy.get('input[type="password"]').should('be.visible')
          cy.task('log', '✅ Champ password trouvé')
        }
        
        if ($body.find('button[type="submit"]').length > 0) {
          cy.get('button[type="submit"]').should('be.visible')
          cy.task('log', '✅ Bouton submit trouvé')
        }
      })
    })
  
    it('teste la navigation dans votre app', () => {
      cy.visit('/')
      
      // Chercher des liens de navigation
      cy.get('a').then(($links) => {
        cy.task('log', `Nombre de liens trouvés: ${$links.length}`)
        
        if ($links.length > 0) {
          // Analyser les 3 premiers liens
          const linksToAnalyze = Math.min(3, $links.length)
          for (let i = 0; i < linksToAnalyze; i++) {
            const link = $links[i]
            const href = link.href || 'no href'
            const text = link.textContent || 'no text'
            cy.task('log', `Lien ${i}: "${text}" -> ${href}`)
          }
        }
      })
      
      // Tester différentes routes potentielles
      const routesToTry = ['/login', '/dashboard', '/auth/login']
      
      routesToTry.forEach((route) => {
        cy.visit(route, { failOnStatusCode: false })
        cy.url().then((currentUrl) => {
          if (currentUrl.includes(route)) {
            cy.task('log', `✅ Route ${route} accessible`)
            
            // Vérifier le contenu de cette route
            cy.get('body').then(($body) => {
              const content = $body.text().substring(0, 100)
              cy.task('log', `Contenu de ${route}: ${content}`)
            })
          } else {
            cy.task('log', `❌ Route ${route} redirige vers ${currentUrl}`)
          }
        })
      })
    })
  
    it('teste une interaction basique', () => {
      cy.visit('/')
      
      // Chercher un élément cliquable
      cy.get('body').then(($body) => {
        // Chercher des boutons
        if ($body.find('button').length > 0) {
          cy.get('button').first().then(($btn) => {
            const btnText = $btn.text()
            cy.task('log', `Premier bouton trouvé: "${btnText}"`)
            
            // Si ce n'est pas un bouton de soumission, on peut le cliquer
            if (!$btn.attr('type') || $btn.attr('type') !== 'submit') {
              cy.wrap($btn).click()
              cy.task('log', '✅ Bouton cliqué avec succès')
            }
          })
        }
        
        // Chercher des inputs pour tester la saisie
        if ($body.find('input[type="text"], input[type="email"]').length > 0) {
          cy.get('input[type="text"], input[type="email"]').first().then(($input) => {
            cy.wrap($input).type('test@example.com')
            cy.task('log', '✅ Saisie dans un champ réussie')
          })
        }
      })
    })
  })