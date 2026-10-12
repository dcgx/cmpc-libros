# CMPC Libros

Inventario web de la tienda: login JWT, listado con filtros, orden múltiple, paginación en servidor, búsqueda con debounce, alta y edición con imagen, ficha, exportación CSV, borrado lógico y auditoría.

## Supuestos

- Precio en CLP. Autor, editorial y género son catálogos: si el nombre no existe, se crea en la misma transacción que el libro.
- `available` es la disponibilidad comercial. `stock` es la cantidad física.
- El borrado marca `deleted_at` y oculta el libro. La auditoría de negocio queda en `audit_logs`, en la misma transacción que el cambio. Cada request HTTP también se registra en el log del proceso.
- Las imágenes se guardan en disco (`uploads`) y se publican en `/uploads`.

## Arranque con Docker

```bash
docker compose up --build
```

- Aplicación: http://localhost:8080
- API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs
- Usuario: `admin@cmpc.cl` / `Admin123!`

## Arranque local del código

Requiere PostgreSQL en `localhost:5432` y la base `cmpc_libros`.

```bash
npm install
npm --prefix apps/api install
npm --prefix apps/web install
npm --prefix apps/api run prisma:deploy
npm run dev
```

## Pruebas

```bash
npm --prefix apps/api test
npm --prefix apps/web test
```

## Arquitectura

Ver `docs/arquitectura.md` y el modelo en `docs/modelo-relacional.dbml` (importable en dbdiagram.io).
