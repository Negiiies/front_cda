// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001', // VÉRIFIEZ QUE C'EST BIEN 3001
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeouts adaptés
    defaultCommandTimeout: 8000,
    requestTimeout: 8000,
    responseTimeout: 8000,
    pageLoadTimeout: 12000,
    
    // Variables d'environnement pour vos tests
    env: {
      BACKEND_URL: 'http://localhost:3000',
      // Utilisateurs de test (basés sur votre seeder)
      ADMIN_EMAIL: 'admin@school.com',
      ADMIN_PASSWORD: 'Admin@123',
      TEACHER_EMAIL: 'john.smith@school.com',
      TEACHER_PASSWORD: 'Teacher1@123',
      STUDENT_EMAIL: 'alice.j@school.com',
      STUDENT_PASSWORD: 'Student1@123'
    },
    
    // Configuration des tests
    video: false,
    screenshotOnRunFailure: true,
    
    // Patterns de fichiers
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    
    setupNodeEvents(on, config) {
      on('task', {
        log(message) {
          console.log(`[CYPRESS]: ${message}`)
          return null
        }
      })
      
      // Ignorer certaines erreurs dans Chrome
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push(
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-sandbox'
          )
        }
        return launchOptions
      })
      
      return config
    }
  }
})