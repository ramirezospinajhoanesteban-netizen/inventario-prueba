/* eslint-disable */
describe('Automatización de Inicio de Sesión - NuevoERP QA', () => {
  const qaUrl = 'https://qa.nuevoerp.co';
  const username = 'pruebas.aleerp2023@sinergiaonline.com';
  const password = 'Sinergia_2023-';

  beforeEach(() => {
    // 1. Navegar al ambiente de pruebas QA
    cy.visit(qaUrl);
  });

  it('Debería mostrar error con credenciales incorrectas', () => {
    // 2. Ingresar usuario incorrecto
    cy.get('input[type="email"], input[name="username"], input[name="email"]')
      .should('be.visible')
      .type('usuario.invalido@sinergia.com');

    // 3. Ingresar contraseña incorrecta
    cy.get('input[type="password"], input[name="password"]')
      .should('be.visible')
      .type('ClaveEquivocada123');

    // 4. Hacer clic en el botón de inicio de sesión
    cy.get('button[type="submit"], input[type="submit"]')
      .click();

    // 5. Verificar que se muestre algún mensaje de error
    // Nota: Dependiendo de la UI, se verifica la presencia de un alert o texto de error
    cy.contains('incorrecta', { matchCase: false }).should('be.visible')
      .or('contain', 'error')
      .or('contain', 'invalido')
      .or('contain', 'datos no coinciden');
  });

  it('Debería iniciar sesión de forma exitosa con credenciales válidas (Bonus)', () => {
    // 2. Ingresar usuario de pruebas QA válido
    cy.get('input[type="email"], input[name="username"], input[name="email"]')
      .should('be.visible')
      .clear()
      .type(username);

    // 3. Ingresar contraseña de pruebas QA válida
    cy.get('input[type="password"], input[name="password"]')
      .should('be.visible')
      .clear()
      .type(password);

    // 4. Hacer clic en el botón de ingresar
    cy.get('button[type="submit"], input[type="submit"]')
      .click();

    // 5. Verificar redirección y acceso exitoso
    // El login exitoso debería llevarnos al dashboard o cambiar la URL
    cy.url().should('not.eq', qaUrl + '/');
    cy.url().should('include', '/dashboard')
      .or('include', '/home')
      .or('include', '/admin');

    // 6. Verificar que algún elemento del dashboard sea visible (ejem. el menú lateral o el nombre del usuario)
    cy.get('body').should('contain', 'Bienvenido')
      .or('contain', 'pruebas')
      .or('contain', 'Dashboard');
  });
});
