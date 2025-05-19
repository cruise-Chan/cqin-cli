declare namespace Cypress {
    interface Chainable {
      <%_ if (uiFramework.includes('Ant')) { _%>
      /**
       * 操作Ant Design选择器
       * @example cy.antSelect('#country', 'China')
       */
      antSelect(selector: string, optionText: string): Chainable<void>
      <%_ } _%>
      
      <%_ if (uiFramework.includes('Element')) { _%>
      /**
       * 操作Element UI选择器 
       * @example cy.elSelect('.city-picker', 'Shanghai')
       */
      elSelect(selector: string, optionText: string): Chainable<void>
      <%_ } _%>
    }
  }