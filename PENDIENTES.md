# Pendientes 1

## Estado: PENDIENTE

### Rechazar actualizaciones PATCH con el body vacío

**Estado: COMPLETADO**

Los DTO de actualización usan `PartialType`, por lo que un `PATCH` con body vacío (`{}`) puede devolverse actualmente con estado `200` sin modificar ningún dato.

Añadir una validación en los métodos `update()` de estos recursos ya creados:

- Type
- Client
- Context
- Text
- Dimensions
- Meta
- Skill
- Tag

La validación puede comprobar que el DTO contiene al menos un campo:

```ts
if (Object.keys(updateDto).length === 0) {
  throw new BadRequestException('No fields to update');
}
```

**Alcance:** es una validación de la API. No requiere una migración de la base de datos.

**Resultado:** los ocho servicios rechazan un DTO vacío con `400 Bad Request` y el mensaje `No fields to update`. No requiere migración de base de datos.

## Pendientes de modelo (desde el punto 13 de FASE-1-CRUD-BASICO.md)

Implementar estos cambios de uno en uno y actualizar este archivo al cerrar cada tarea.

### 2. Asociar assets directamente a publicaciones

**Estado: COMPLETADO**

Crear `PUBLICATION_ASSET` como entidad de asociación entre `Publication` y `Asset`, sin sustituir las relaciones actuales con `Collection` ni `AssetCollection`.

- Campos: `id` (PK identity), `publication_id` (FK no nullable), `asset_id` (FK no nullable) y `role` (VARCHAR no nullable).
- Añadir `UNIQUE(publication_id, asset_id, role)`.
- Incorporar entidad, DTOs, servicio, controlador, módulo y migración TypeORM siguiendo el CRUD existente.
- La spec de servicio cubre creación, listado, actualización, eliminación, referencias inexistentes y conflictos de unicidad.
- La migración se ejecutó con `npm run typeorm -- migration:run -d src/database/data-source.ts` (código de salida 0).
- El CRUD se verificó manualmente desde Postman.

**Nota:** `THUMBNAIL` y `MAIN_CONTENT` son ejemplos de valores para `role`, no una lista cerrada. La obligatoriedad de tener esos roles no está definida.

### 3. Añadir formato a TEXT

**Estado: COMPLETADO**

Añadir `format` a `Text` como `VARCHAR NOT NULL`, con valores permitidos `PLAIN` y `MD`.

- Mantener `text` como `TEXT NOT NULL` para ambos formatos.
- Validar los valores permitidos en la API y reflejar el cambio en entidad, DTOs y migración.
- No cambiar `TextContent` ni `AssetText`: el formato pertenece a `Text`.
- La migración asigna `PLAIN` a los registros existentes y elimina el default para exigir el formato en nuevas inserciones.
- Migración ejecutada y `POST`/`PATCH /text` verificados manualmente desde Postman.

### 4. Añadir icono a SKILL

**Estado: COMPLETADO**

Añadir `icon` a `Skill` como `VARCHAR` nullable, para almacenar una URL o ruta del logotipo.

- Reflejar el campo en entidad, DTOs y migración.
- No crear entidades ni relaciones nuevas; cada skill conserva su icono independientemente de sus grupos.
- Se valida como cadena y admite URL, ruta o `null`, sin restringir el formato.
- Migración ejecutada y creación/actualización verificadas manualmente desde Postman.

### 5. Cambiar las rutas de recursos de singular a plural

**Estado: IMPLEMENTADO; migración aplicada y colección actualizada. Pendiente ejecutar las solicitudes en Postman.**

Actualizar la identificación de los recursos en las rutas de la API para que usen nombres plurales en lugar de singulares.

- Revisar las rutas base de todos los controladores y mantener una convención plural uniforme.
- La colección [RESTful API Basics #blueprint.postman_collection.json](postman/RESTful%20API%20Basics%20%23blueprint.postman_collection.json) ya usa rutas plurales.
- `Skill` usa `/skills`; el recurso antes llamado `Skills` se renombró coherentemente a `PublicationSkills`, con ruta `/publication-skills`, módulo y tabla `publication_skills`. `Dimensions` conserva `/dimensions`, que ya es plural.
- La migración `RenameSkillsToPublicationSkills` renombra la tabla y la FK de `skill_group` sin recrear ni perder registros.
- La migración se ejecutó y el usuario confirmó que la tabla quedó actualizada.
- Falta ejecutar y verificar las rutas y relaciones desde Postman.

### 6. Usar camelCase en la API y TypeScript

**Estado: IMPLEMENTADO; colección actualizada. Pendiente verificar cuerpos y respuestas desde Postman.**

Seguir [Cambio a camelcase.md](Cambio%20a%20camelcase.md) para revisar DTOs, propiedades de entidades, controladores, servicios, parámetros y respuestas JSON.

- Mantener los nombres de columnas y claves foráneas existentes en PostgreSQL (`snake_case`), mapeándolos desde las entidades con `@Column({ name: '...' })` o `@JoinColumn({ name: '...' })` cuando corresponda.
- Cambiar solo los nombres que todavía no cumplan la convención; no renombrar propiedades que ya estén en `camelCase`.
- Los cuerpos de la colección Postman usan propiedades `camelCase`, incluido `clientId`; falta ejecutarlos y comprobar que las respuestas JSON también usan `camelCase`.
- Los campos `snake_case` restantes en el código son nombres explícitos de columnas en `@JoinColumn`; el renombre de `skills` a `publication_skills` y de su FK se gestiona en la migración del punto anterior.
