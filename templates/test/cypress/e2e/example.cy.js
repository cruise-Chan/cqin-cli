// https://on.cypress.io/api

describe('My First Test', () => {
  it('visits the app root url', () => {
    cy.visit('/')
    cy.contains('h1', 'You did it!')
  })
})

describe('My Second Test', () => {
  it('visits the app about url', () => {
    cy.visit('/About')
    cy.contains('div', 'This is an about page')
  })
})
