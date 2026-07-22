# Manual Técnico - Arquitectura y Funcionamiento del Código

Este documento explica de manera detallada el funcionamiento, la arquitectura y las decisiones de diseño aplicadas en el desarrollo del módulo de gestión de inventarios (Laravel + Inertia React) y el script de pruebas automáticas (Cypress).

---

## 1. Arquitectura del Sistema (Laravel + Inertia.js + React)

El proyecto utiliza un flujo híbrido moderno:
1.  **Backend (Laravel):** Administra la base de datos (PostgreSQL), maneja las rutas web/API y la validación de peticiones entrantes.
2.  **Puente (Inertia.js):** Sirve como puente entre Laravel y React. Permite que el backend devuelva componentes de React directamente desde las rutas sin necesidad de construir una SPA compleja con enrutamiento de cliente separado (como React Router).
3.  **Frontend (React + Tailwind CSS):** Provee una interfaz de usuario premium, reactiva e interactiva. Utiliza componentes reutilizables y estilos Tailwind para la compatibilidad con el modo claro/oscuro.

---

## 2. Funcionamiento del Backend

### 2.1 Base de Datos (Modelos y Relaciones)
*   **Modelo Category (`Category.php`):** Representa las categorías auxiliares. Tiene una relación de uno a muchos (`HasMany`) hacia la tabla de productos.
*   **Modelo Product (`Product.php`):** Representa los productos del inventario. Define los campos asignables (`code`, `name`, `status`, `description`, `category_id`) y una relación inversa `BelongsTo` hacia la categoría. Además, formatea el estado booleano de la base de datos mediante `$casts = ['status' => 'boolean']`.

### 2.2 Validación de Datos (`ProductRequest.php`)
Antes de crear o actualizar un producto, Laravel intercepta la petición usando un Form Request (`ProductRequest.php`). Aquí se aplican de forma estricta las validaciones técnicas:
```php
'code' => [
    'required', 'string', 'max:20', 'alpha_num',
    Rule::unique('products', 'code')->ignore($this->product)
],
'name' => ['required', 'string', 'max:150'],
'description' => ['required', 'string', 'max:500'],
'category_id' => ['required', 'integer', 'exists:categories,id'],
'status' => ['required', 'boolean'],
```
*   `alpha_num` asegura el comportamiento alfanumérico para el Código.
*   `unique` con `ignore` previene que se duplique un código existente, pero permite guardar el producto si estamos editando el mismo registro.

### 2.3 Controlador de la API (`ProductController.php`)
Provee endpoints de tipo RESTful que retornan respuestas en JSON (`JsonResponse`):
*   `index()`: Obtiene todos los productos incluyendo su relación con categorías (`Product::with('category')`) en orden descendente.
*   `store(ProductRequest $request)`: Valida la entrada y crea un nuevo producto en la base de datos.
*   `update(ProductRequest $request, Product $product)`: Actualiza los campos modificados del producto.
*   `destroy(Product $product)`: Elimina el registro físico del producto de la base de datos.

---

## 3. Funcionamiento del Frontend (React)

Toda la lógica de usuario del inventario se encuentra encapsulada de manera limpia y responsiva en:
👉 **[resources/js/pages/products/index.tsx](file:///c:/dev/inventario-prueba/resources/js/pages/products/index.tsx)**

### 3.1 Ciclo de Carga y Carga Inicial de Datos
Al montarse el componente (`useEffect`), se realiza una petición asíncrona concurrente mediante `Promise.all` y `fetch` del navegador hacia los endpoints de la API:
*   `/api/products` -> Llena el estado `products`.
*   `/api/categories` -> Llena el estado `categories` (para poblar los dropdowns).

### 3.2 Búsqueda y Filtrado en Tiempo Real (Pure Memory Filters)
En lugar de saturar el servidor con múltiples peticiones por cada tecla que presiona el usuario, el filtrado se realiza **en el cliente** mediante el hook `useMemo`:
```typescript
const filteredProducts = useMemo(() => {
    return products.filter(product => {
        const matchesSearch = 
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            product.code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.category_id === Number(selectedCategory);
        const matchesStatus = selectedStatus === 'all' || (selectedStatus === 'active' && product.status) || (selectedStatus === 'inactive' && !product.status);
        return matchesSearch && matchesCategory && matchesStatus;
    });
}, [products, searchQuery, selectedCategory, selectedStatus]);
```
Esto garantiza un rendimiento ultrarrápido y una respuesta inmediata del frontend ante cualquier filtro.

### 3.3 Clamping y Paginación Eficiente sin Efectos Secundarios
Para cumplir con los estrictos estándares de ESLint de React y evitar renders en cascada innecesarios, se calcula una página ajustada (`clampedPage`) en lugar de usar efectos secundarios sincronizados (`useEffect`):
```typescript
const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
const clampedPage = useMemo(() => {
    return Math.min(currentPage, totalPages || 1);
}, [currentPage, totalPages]);
```
Esto asegura que si filtras o eliminas registros y el número total de páginas disminuye por debajo de la página actual, la interfaz se ajusta dinámicamente y de manera segura al último límite sin gatillar renders cíclicos.

### 3.4 Exportadores del Lado del Cliente
El frontend incluye lógica optimizada para la descarga de archivos:

#### A. Exportación CSV (`exportToCSV`)
1.  Construye una matriz de cadenas con las columnas.
2.  Garantiza el correcto formato del texto (escapa saltos de línea y rodea valores con comillas).
3.  Inserta un **UTF-8 BOM (`\uFEFF`)** al inicio del texto. Esto es indispensable para que Excel interprete correctamente los caracteres con acentos y la letra "ñ" al abrir el CSV.
4.  Crea un archivo temporal binario (`Blob`) de tipo `text/csv` y simula un clic de descarga.

#### B. Exportación Excel (`exportToExcel`)
1.  Genera una cadena de texto que contiene una estructura HTML básica y una tabla (`<table>`).
2.  Define estilos CSS internos para formatear la cabecera (color indigo), bordes de celda y filas alternas con fondo gris.
3.  Agrega metadatos XML especiales de Microsoft Excel en la cabecera (`xmlns:x="urn:schemas-microsoft-com:office:excel"`).
4.  Descarga el archivo con extensión `.xls`. Excel reconoce este archivo XML de manera nativa y lo abre con su estructura de columnas y formatos de celda intactos.

#### C. Exportación PDF (`exportToPDF`)
1.  Abre una ventana en blanco usando `window.open`.
2.  Escribe dinámicamente un documento HTML estilizado con CSS optimizado para impresión (diseño limpio de grillas y tipografía legible).
3.  Llama al método nativo `window.print()` del navegador, el cual abre directamente el diálogo de guardado a PDF del sistema operativo.
4.  Cierra la pestaña emergente de manera limpia una vez que se completa la impresión.

---

## 4. Script de Automatización Cypress (`login.cy.js`)

El script de pruebas automatizadas está diseñado para ejecutarse sobre el ambiente de producción QA: `https://qa.nuevoerp.co`.

### Estructura de la prueba:
*   **`beforeEach`:** Ejecuta un `cy.visit('/')` para asegurarse de comenzar en la página de inicio limpia antes de cada prueba.
*   **Caso 1 (Credenciales Incorrectas):**
    *   Utiliza selectores genéricos robustos para identificar el input de email (`input[type="email"]`) y contraseña (`input[type="password"]`).
    *   Escribe datos de prueba erróneos y hace clic en enviar.
    *   Verifica mediante aserciones que la UI responda mostrando un texto de error (por ejemplo, "incorrecta", "invalido", etc.).
*   **Caso 2 (Credenciales Válidas):**
    *   Limpia los campos con `.clear()`.
    *   Digita el usuario `pruebas.aleerp2023@sinergiaonline.com` y la clave `Sinergia_2023-`.
    *   Envía el formulario de ingreso.
    *   Valida que la URL del navegador ya no sea la página principal y que ahora incluya rutas como `/dashboard` o `/home`.
    *   Valida que el DOM contenga palabras como "Dashboard", "Bienvenido" o "pruebas", confirmando un inicio de sesión exitoso.
