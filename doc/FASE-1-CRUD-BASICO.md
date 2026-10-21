- Las violaciones de unicidad PostgreSQL (`23505`) se convierten a **`409 Conflict`**. En `PublicationContext`, al actualizar, se comprueba previamente si la posición ya está ocupada **en el mismo contexto**, excluyendo el propio registro. El `409` generado por esa comprobación identifica la posición; el `catch` de la constraint de base de datos usa un mensaje genérico de asociación duplicada.
# Publicator — Estado técnico al finalizar la Fase 1

> Referencia técnica para retomar el proyecto. Se ha cotejado con el código fuente presente en el workspace. Describe el estado del backend en el checkout actual; no demuestra por sí sola qué migraciones están aplicadas en la base de datos ni define los requisitos funcionales todavía pendientes.

## Estado

**La Fase 1 — CRUD básico está terminada.** Las 19 entidades del modelo tienen sus módulos CRUD implementados, incluidas las últimas asociaciones `PublicationContext` y `TextContent`.

La siguiente fase no consiste en añadir más CRUD genéricos. La **Fase 2** debe definir el diseño específico de Admin y Cliente, los casos de uso, los endpoints de consumo y las estructuras de respuesta adecuadas para cada flujo. El checkout documentado contiene el backend NestJS; no incluye una aplicación frontend ni una especificación completa de esos flujos.

## 1. Objetivo de la Fase 1

Construir la base persistente del proyecto y exponer operaciones genéricas para crear, consultar, modificar y eliminar registros de las entidades del modelo relacional. Esta fase sirve para comprobar el esquema, las claves y las operaciones de datos; todavía no define las APIs finales orientadas a las experiencias de administración o de cliente.

## 2. Stack y configuración

La implementación del checkout usa:

- **NestJS 12**, **TypeORM 1.1.1** y **PostgreSQL**, con el driver `pg`.
- **ESM** (`"type": "module"`); los imports TypeScript usan extensiones `.js`.
- Migraciones TypeORM configuradas en `src/database/data-source.ts`. El `DataSource` carga entidades desde `src/**/*.entity.ts` y migraciones desde `src/database/migrations/*.ts`.
- En runtime, `TypeOrmModule` toma la conexión de `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`, y usa `autoLoadEntities: true`. No se configura `synchronize` ni ejecución automática de migraciones.
- `main.ts` instala un `ValidationPipe` global con `whitelist: true`, `forbidNonWhitelisted: true` y `transform: true`. No se configura un prefijo global de rutas.
- El `package.json` ofrece scripts para `build`, `start`, `start:dev`, `start:prod`, `lint`, `test`, `test:e2e` y `test:cov`. Solo define el comando base `typeorm`; no hay scripts npm dedicados a `migration:generate`, `migration:run` o `migration:show`.

### Ejecución local

`docker-compose.yml` levanta PostgreSQL en el puerto `5432`, con base `publicator` y credenciales locales `admin` / `root`. `publicator/.env.example` apunta al mismo host, puerto y base, pero configura el usuario `postgres` y una contraseña vacía. Al usar Compose, hay que ajustar `DB_USER` y `DB_PASSWORD` para que coincidan, o modificar la configuración de Compose. Estas credenciales son de desarrollo y no deben reutilizarse en producción.

La API escucha en `PORT` o, si no está definido, en el puerto `3000`. El flujo básico es levantar PostgreSQL, instalar dependencias en `publicator/` con `npm install` y ejecutar `npm run start:dev`. Las migraciones deben gestionarse por separado con el `DataSource` configurado; iniciar la API no acredita que el esquema esté actualizado.

## 3. Organización de módulos

La organización implementada es modular: cada recurso tiene un módulo NestJS con, como mínimo, entidad, DTOs de creación y actualización, controlador y servicio. Los recursos relacionados se registran mediante `TypeOrmModule.forFeature(...)` cuando el servicio necesita acceder a sus repositorios.

El inventario de módulos bajo `src/modules` es:

```text
src/modules/
├── asset/
├── asset-collection/
├── asset-text/
├── client/
├── collection/
├── content/
├── context/
├── dimensions/
├── meta/
├── publication/
├── publication-context/
├── publication-tag/
├── skill/
├── skill-group/
├── skills/
├── tag/
├── text/
├── text-content/
└── type/
```

El inventario coincide con las 19 carpetas de módulo y los 19 controladores presentes en `publicator/src/modules`.

## 4. Entidades: 19 tablas

| Entidad | Qué representa |
|---|---|
| `Context` | Un contexto o ámbito en el que se organizan publicaciones. |
| `PublicationContext` | Asociación de una publicación con un contexto; guarda atributos propios de esa relación, como posición, visibilidad y destacado. |
| `Publication` | Una publicación del sistema. |
| `Type` | Catálogo de tipos usado por otros recursos del modelo. |
| `Meta` | Datos de metadatos asociados a una publicación. |
| `Client` | Un cliente del sistema. |
| `Content` | Una pieza de contenido. |
| `TextContent` | Asociación entre contenido y texto, con un campo `type`; `text_id` se definió nullable en el esquema comentado. |
| `Text` | Almacén común de textos reutilizable desde contenido o assets. |
| `Skills` | Recurso/catálogo de skills en el modelo existente. |
| `SkillGroup` | Agrupación de skills. |
| `Skill` | Una skill individual. |
| `Tag` | Una etiqueta. |
| `PublicationTag` | Asociación entre publicaciones y etiquetas. |
| `Collection` | Una colección de assets. |
| `Asset` | Un recurso asset; el ejemplo implementado contempla tipo, URL y una relación opcional con dimensiones. |
| `AssetCollection` | Asociación entre colección y asset, con un `role`. |
| `AssetText` | Asociación entre asset y texto, con un `type`. |
| `Dimensions` | Datos dimensionales referenciables por assets. |

`URL` y `Format` se descartaron como tablas/entidades independientes en el modelo implementado. No se debe inferir de ello que no existan campos URL o de tipo/formato en otras entidades: por ejemplo, el historial muestra `Asset.url` como atributo de `Asset`.

## 5. Relaciones principales y asociaciones

Las asociaciones explícitas que forman parte del modelo son:

- `PublicationContext`: conecta `Publication` y `Context` y conserva datos de la asociación (`position`, `visible`, `featured`).
- `PublicationTag`: conecta `Publication` y `Tag`.
- `AssetCollection`: conecta `Asset` y `Collection` y conserva `role`.
- `AssetText`: conecta `Asset` y `Text` y conserva `type`.
- `TextContent`: conecta `Content` y `Text` y conserva `type`; la relación con `Text` se indicó nullable.

Otras relaciones declaradas en las entidades actuales:

- `Publication` referencia `Type` con una relación **muchos a uno** y `Meta` con una relación **uno a uno**; `Publication` contiene la FK `meta_id`.
- `Meta` puede referenciar un `Client` (relación muchos a uno nullable).
- `Content`, `Collection` y `Skills` referencian `Publication` mediante relaciones muchos a uno.
- `SkillGroup` referencia `Skills` y `Skill` mediante relaciones muchos a uno.
- `Asset` referencia `Dimensions`; la relación y `dimensions_id` son opcionales.
- Las entidades de asociación referencian sus entidades principales mediante claves foráneas. Por ejemplo, `AssetText.asset_id → Asset.id` y `AssetText.text_id → Text.id`.
- Un mismo `Text` puede reutilizarse tanto desde `AssetText` como desde `TextContent`; se decidió mantener **una sola tabla `Text`**.

Las entidades TypeORM no mantienen relaciones inversas por defecto. Se añadieron relaciones desde el lado que contiene la FK y relaciones inversas solo cuando fueran necesarias para una consulta o requisito concreto.

## 6. Constraints e integridad

Las constraints declaradas en las entidades y migraciones del checkout incluyen:

- Las relaciones entre recursos se materializan como **FK** y las relaciones obligatorias se declaran no nullable; la opcionalidad depende de cada campo.
- Valores únicos simples: `Asset.url`, `Client.name`, `Context.name`, `Meta.slug`, `Skill.name`, `Tag.name` y `Type.name`.
- `Dimensions`: `UNIQUE(width, height)`.
- `AssetCollection`: `UNIQUE(collection_id, asset_id, role)`.
- `AssetText`: `UNIQUE(asset_id, text_id, type)`.
- `PublicationTag`: `UNIQUE(publication_id, tag_id)`.
- `PublicationContext`: `UNIQUE(publication_id, context_id)` y `UNIQUE(context_id, position)`. La posición es única **dentro de un contexto**, independientemente de la publicación; puede repetirse en contextos distintos.
- `Publication`–`Meta`: la FK `meta_id` es propietaria de la relación 1:1 y es única.
- En varios servicios, las violaciones de unicidad PostgreSQL (`23505`) se traducen a conflicto HTTP `409`.

## 7. CRUD genérico

Los controladores siguen el patrón CRUD básico por recurso. Para un recurso con ruta base `/<recurso>` están disponibles:

| Método | Ruta | Operación |
|---|---|---|
| `POST` | `/<recurso>` | Crear un registro. |
| `GET` | `/<recurso>` | Listar registros; si no hay filas, devuelve `200` con `[]`. |
| `GET` | `/<recurso>/:id` | Obtener un registro por identificador. |
| `PATCH` | `/<recurso>/:id` | Actualizar parcialmente un registro. |
| `DELETE` | `/<recurso>/:id` | Eliminar el registro indicado. |

Ejemplo de ruta: `PATCH /asset/2`. La actualización usa `PATCH`, no `PUT`. No hay prefijo global configurado en `main.ts`.

## 8. Validación y errores

- Los DTOs definen validaciones de entrada con `class-validator`, por ejemplo tipo entero para identificadores, booleanos para flags y cadenas no vacías con límites de longitud cuando corresponda.
- Los DTOs de actualización se construyen como versión parcial de los de creación (`PartialType`), por lo que los campos pueden omitirse en un `PATCH`.
- El rechazo de un `PATCH` con cuerpo vacío `{}` no está implementado de forma uniforme. Once servicios lo rechazan con **`400 Bad Request`** (`No fields to update`): `Asset`, `AssetCollection`, `AssetText`, `Collection`, `Content`, `Publication`, `PublicationContext`, `PublicationTag`, `SkillGroup`, `Skills` y `TextContent`. Sigue pendiente en `Client`, `Context`, `Dimensions`, `Meta`, `Skill`, `Tag`, `Text` y `Type`; consultar [PENDIENTES.md](PENDIENTES.md).
- Una búsqueda o referencia a un registro inexistente produce **`404 Not Found`**. Los servicios de asociaciones comprueban las entidades referenciadas antes de guardar.
- Las violaciones de unicidad PostgreSQL (`23505`) se convierten en **`409 Conflict`**. En `PublicationContext`, al actualizar, se comprueba previamente si la posición ya está ocupada **en el mismo contexto**, excluyendo el propio registro. El `409` generado por esa comprobación identifica la posición; el `catch` de la constraint de base de datos usa un mensaje genérico de asociación duplicada.
- Una lista sin registros devuelve `200 OK` y `[]`; un identificador que no existe sí devuelve `404`.
- No se documenta una política general de borrado en cascada. En el caso comentado de `AssetText`, borrar la asociación solo elimina esa fila y no elimina el `Text` asociado.

## 9. Migraciones y base de datos

El esquema se gestiona con migraciones de TypeORM, no solo con sincronización automática. Durante el desarrollo se generaron y ejecutaron migraciones a medida que se incorporaban entidades. Se detectó, por ejemplo, que `asset_text` todavía no existía en PostgreSQL aunque su entidad estuviera en el código; se generó y ejecutó su migración antes de continuar.

Al cierre se consideró que la base de datos contenía las 19 tablas y que el CRUD básico estaba listo. El código actual define `UNIQUE(context_id, position)` para `PublicationContext`; la migración `1791046416427-AddUniquePublicationContext-position-2.ts` reemplaza la constraint anterior `UNIQUE(position, publication_id)` por esa regla. El historial disponible no incluye el resultado final de `migration:show` ni una inspección del esquema vivo; por eso, no se puede asegurar aquí que todas las migraciones estén aplicadas en la base de datos conectada.

**Antes de retomar cambios de esquema:** consultar el estado de migraciones, revisar las migraciones generadas y comparar el esquema PostgreSQL con las entidades. No editar una migración que ya se haya aplicado; añadir una nueva para cambios posteriores.

## 10. Comprobaciones realizadas en Postman

Durante la fase se probaron manualmente rutas CRUD y casos de error. Del historial quedan documentados estos casos concretos:

- Uso de `PATCH` para actualizar (se corrigió una petición enviada como `PUT`, que no correspondía a la ruta implementada).
- Creación de `PublicationContext` con campos booleanos `visible` y `featured` y comprobación de que PostgreSQL acepta y devuelve `true`/`false`.
- Detección manual de conflictos `UNIQUE` en asociaciones. En el código actual, la comprobación previa de actualización identifica la posición duplicada dentro del contexto; el `catch` de la constraint devuelve un mensaje genérico.
- Comprobación de listado vacío: la respuesta esperada es `200` con `[]`; el error inicial de `asset_text` se debió a que aún faltaba ejecutar su migración.
- Comprobación de que borrar `AssetText` no borra el registro de `Text` asociado.

El material disponible no incluye una colección exportada de Postman ni un inventario que demuestre que cada método de cada uno de los 19 recursos se ejecutó. Por tanto, la afirmación de cierre de fase refleja el estado acordado del trabajo; esta memoria no atribuye una cobertura exhaustiva de pruebas manuales que no está registrada.

En el checkout actual, las pruebas automatizadas visibles son las pruebas de ejemplo de NestJS: un test unitario de `AppController` y un test e2e de `GET /`, ambos comprueban `Hello World!`. No hay pruebas automatizadas específicas de los 19 CRUD en los archivos de test presentes.

## 11. Decisiones de diseño acordadas

1. **Una única tabla `Text`.** El texto se almacena una vez y `TextContent`/`AssetText` lo asocian a su uso correspondiente.
2. **Sin tablas `URL` y `Format`** como entidades independientes en el modelo final de esta fase.
3. **Entidades de asociación explícitas** cuando la relación tiene atributos propios o constraints, como `role`, `type`, `position`, `visible` o `featured`.
4. **Sin relaciones inversas TypeORM por sistema.** Solo incorporarlas cuando un caso de consulta lo requiera.
5. **Constraints respaldadas en la base de datos.** Las comprobaciones del servicio mejoran los mensajes, pero la constraint sigue siendo la garantía de integridad.
6. **Fase 1 centrada en CRUD genérico.** El diseño de endpoints orientados a Admin/Cliente y las respuestas de consumo queda para la Fase 2.

## 12. Punto de partida para la Fase 2

La Fase 1 queda cerrada. Para iniciar la siguiente fase, el trabajo pendiente de diseño es:

- definir qué acciones necesita realizar **Admin** y qué acciones necesita realizar **Cliente**;
- convertir esas acciones en casos de uso concretos;
- diseñar los endpoints de consumo para esos casos, más allá del CRUD genérico;
- acordar las estructuras de respuesta, incluyendo qué relaciones se incluyen y cómo se presenta el contenido;
- revisar autenticación/autorización y otros requisitos transversales solo si forman parte de los casos de uso acordados.

Este documento es una memoria del estado reportado y un mapa para retomar el proyecto. Para cambios técnicos posteriores, el repositorio y las migraciones aplicadas son la fuente definitiva de verdad.


Sí. Hay que modificar el modelo actual de Publicator para permitir que una `Publication` tenga assets directamente, colecciones o ambas cosas.

### 13 Cambios en el modelo

Añadir una entidad intermedia: **`PUBLICATION_ASSET`**.

La estructura quedaría así:

```text
PUBLICATION
   │
   ├── PUBLICATION_ASSET ─── ASSET
   │
   └── COLLECTION
          │
          └── ASSET_COLLECTION ─── ASSET
```

Esto permite que una publicación tenga assets individuales sin necesidad de crear colecciones artificiales, y que también pueda agrupar otros assets en colecciones.

### 13.1. Nueva tabla `PUBLICATION_ASSET`

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | INTEGER | PK, IDENTITY |
| `publication_id` | INTEGER | FK → PUBLICATION, NOT NULL |
| `asset_id` | INTEGER | FK → ASSET, NOT NULL |
| `role` | VARCHAR | NOT NULL |

La restricción `UNIQUE(publication_id, asset_id, role)` evitaría duplicar la misma asociación con el mismo rol, permitiendo asignar roles distintos al mismo asset.

El campo `role` podría identificar funciones como `THUMBNAIL` o `MAIN_CONTENT`.

### 13.2. Mantener las tablas actuales

No necesitas eliminar ni sustituir ninguna tabla:

- `PUBLICATION`: sigue siendo el objeto editorial central.
- `ASSET`: sigue siendo el catálogo de recursos.
- `COLLECTION`: sigue perteneciendo obligatoriamente a una publicación y tendrá su propio `position`.
- `ASSET_COLLECTION`: sigue relacionando assets con colecciones y manteniendo su propio `role`.

### 13.3. Resultado

Una publicación podría tener esta estructura:

```text
PUBLICATION: Campaña X
│
├── Assets directos
│   ├── logo.svg [THUMBNAIL]
│   └── hero.webp [MAIN_CONTENT]
│
├── COLLECTION: GALLERY [position: 1]
│   ├── image-01.webp
│   └── image-02.webp
│
└── COLLECTION: RESPONSIVE [position: 2]
    ├── desktop.webp
    └── mobile.webp
```

**Una cuestión importante:** el modelo permitirá asociar assets directamente y mediante colecciones, pero no obligará a que cada publicación tenga una miniatura o un contenido principal. Esa obligatoriedad, si la necesitas, habrá que resolverla mediante las reglas de validación de la aplicación.

Este cambio afecta al **modelo relacional**, al esquema de PostgreSQL y, posteriormente, a las entidades y migraciones de TypeORM. No es necesario implementarlo todavía: primero conviene incorporar `PUBLICATION_ASSET` al modelo y continuar con el diseño del Admin.

Cambio en el modelo TEXT:
- Añadir la propiedad format (VARCHAR NOT NULL), con los valores permitidos PLAIN y MD.
- Mantener text como TEXT NOT NULL, independientemente del formato.
- PLAIN: texto sin formato, por ejemplo, un alt text.
- MD: texto en Markdown, con soporte para negritas, enlaces, listas, etc.
- El formato determina qué editor se muestra en el Admin y cómo se renderiza el texto en el cliente.
No requiere cambios en TEXT_CONTENT ni en ASSET_TEXT, porque el formato pertenece a TEXT, independientemente de sus relaciones.


Cambio en el modelo SKILL:
- Añadir la propiedad icon (VARCHAR), nullable.
- Almacena la URL o ruta del logotipo de la tecnología o aplicación.
- Cada skill puede tener su propio icono, independientemente de los grupos a los que pertenezca.
- No requiere crear nuevas entidades ni relaciones.
- Los iconos se mostrarán junto al nombre de cada skill en los paneles de transferencia y en los lugares donde se representen las tecnologías.

METER DESCRIPCION A SKILLS GROUP?????