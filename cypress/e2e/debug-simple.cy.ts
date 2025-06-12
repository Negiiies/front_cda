// cypress/e2e/debug-simple.cy.ts
describe('Debug Simple', () => {
    it('affiche tout ce qui est sur la page racine', () => {
      cy.visit('/')
      
      // Capturer le HTML complet (les premiers 1000 caractères)
      cy.get('html').then(($html) => {
        const htmlContent = $html.html().substring(0, 1000)
        cy.task('log', `HTML de la page: ${htmlContent}`)
      })
      
      // Capturer le texte visible
      cy.get('body').then(($body) => {
        const bodyText = $body.text()
        cy.task('log', `Texte visible: ${bodyText}`)
      })
      
      // Lister tous les éléments de formulaire
      cy.get('form, input, button, select, textarea').then(($elements) => {
        cy.task('log', `Éléments de formulaire trouvés: ${$elements.length}`)
        
        // Correction : utiliser une boucle for au lieu de .each()
        for (let i = 0; i < $elements.length; i++) {
          const element = $elements[i]
          const tagName = element.tagName.toLowerCase()
          const type = (element as HTMLInputElement).type || 'no-type'
          const id = element.id || 'no-id'
          const className = element.className || 'no-class'
          
          cy.task('log', `Élément ${i}: <${tagName}> type="${type}" id="${id}" class="${className}"`)
        }
      })
    })
  
    it('teste les routes une par une', () => {
      const routes = ['/', '/login', '/dashboard', '/auth/login']
      
      routes.forEach((route) => {
        cy.visit(route, { failOnStatusCode: false })
        
        cy.url().then((currentUrl) => {
          cy.task('log', `Route ${route} -> URL finale: ${currentUrl}`)
        })
        
        cy.title().then((title) => {
          cy.task('log', `Titre de la page: ${title}`)
        })
        
        // Vérifier si la page contient des erreurs
        cy.get('body').then(($body) => {
          const text = $body.text().toLowerCase()
          if (text.includes('error') || text.includes('404') || text.includes('not found')) {
            cy.task('log', `❌ Page d'erreur détectée pour ${route}`)
          } else {
            cy.task('log', `✅ Page ${route} semble OK`)
          }
        })
      })
    })
    
    it('inspection détaillée de la page', () => {
      cy.visit('/')
      
      // Vérifier le titre de la page
      cy.title().should('not.be.empty')
      
      // Compter les différents types d'éléments
      cy.get('div').then(($divs) => {
        cy.task('log', `Nombre de div: ${$divs.length}`)
      })
      
      cy.get('input').then(($inputs) => {
        cy.task('log', `Nombre d'inputs: ${$inputs.length}`)
        
        if ($inputs.length > 0) {
          // Analyser chaque input individuellement
          cy.wrap($inputs).each(($input, index) => {
            const type = $input.attr('type') || 'text'
            const placeholder = $input.attr('placeholder') || 'no placeholder'
            const name = $input.attr('name') || 'no name'
            
            cy.task('log', `Input ${index}: type=${type}, name=${name}, placeholder=${placeholder}`)
          })
        }
      })
      
      cy.get('button').then(($buttons) => {
        cy.task('log', `Nombre de boutons: ${$buttons.length}`)
        
        if ($buttons.length > 0) {
          cy.wrap($buttons).each(($button, index) => {
            const text = $button.text().trim()
            const type = $button.attr('type') || 'button'
            
            cy.task('log', `Bouton ${index}: type=${type}, text="${text}"`)
          })
        }
      })
    })
  })