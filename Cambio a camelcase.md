No necesariamente. **Los DTO son el primer sitio que debes revisar, pero el cambio puede afectar también a las entidades y a las respuestas de la API.**

### Resumen para implementar el cambio

**Objetivo:** utilizar `camelCase` en la API y mantener `snake_case` en PostgreSQL.

| Elemento | Cambio |
|---|---|
| DTO de entrada | Cambiar las propiedades a `camelCase`. |
| Entidades TypeORM | Revisar las propiedades y utilizar `camelCase`, si todavía están en `snake_case`. |
| Columnas PostgreSQL | Mantener los nombres actuales en `snake_case`. |
| Controladores | Revisar los parámetros de consulta y las propiedades que reciben. |
| Servicios | Revisar las referencias a propiedades renombradas. |
| Respuestas JSON | Comprobar que las propiedades se devuelven en `camelCase`. |
| Pruebas de Postman | Actualizar los cuerpos JSON y los parámetros de consulta. |

### 1. DTO

Por ejemplo, cambiar:

```typescript
type_id: number;
client_id: number;
```

Por:

```typescript
typeId: number;
clientId: number;
```

### 2. Entidades TypeORM

Si una entidad tiene:

```typescript
@Column({ name: 'client_id' })
client_id: number;
```

Cambiarla a:

```typescript
@Column({ name: 'client_id' })
clientId: number;
```

Así, TypeORM mantiene la columna `client_id` en PostgreSQL, mientras que el código utiliza `clientId`.

**Importante:** si las entidades ya utilizan `camelCase`, no necesitas modificarlas.

### 3. Controladores y servicios

Busca referencias a las propiedades antiguas, como `dto.type_id` o `entity.client_id`, y actualízalas cuando corresponda.

Comprueba también los filtros de los listados. Por ejemplo, el parámetro HTTP debe ser `typeId`, aunque internamente la consulta SQL filtre por `type_id`.

### 4. Respuestas JSON

Si los controladores devuelven directamente entidades TypeORM, las propiedades de la respuesta normalmente coincidirán con los nombres de las propiedades de las entidades.

Por tanto, si estas ya están en `camelCase`, probablemente no necesites una transformación adicional.

### 5. Qué no debes cambiar

- Los nombres de las columnas PostgreSQL.
- Las claves foráneas existentes en la base de datos.
- Las rutas de la API, como `/api/publications`.
- Los nombres de las propiedades que ya estén correctamente en `camelCase`.

**Mi recomendación:** revisa primero las entidades y los DTO. Después, actualiza controladores y servicios según los cambios reales. No modifiques archivos que ya cumplen la convención.

El objetivo no es renombrar todo el proyecto, sino **separar la nomenclatura del código TypeScript (`camelCase`) de la nomenclatura de la base de datos (`snake_case`)**.