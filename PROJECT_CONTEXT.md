# Publicator — Contexto del proyecto

**Corte de información:** 2026-10-30. Este documento describe el checkout presente en `main`, commit `8f0d2f2`, y distingue código existente de comportamiento verificado. No incluye credenciales ni valores de secretos.

## Cómo leer este documento

- **Verificado en el entorno actual:** se consultó el contenedor PostgreSQL activo y su tabla TypeORM `migrations`; las consultas fueron de solo lectura.
- **Presente en el código:** existe implementación, pero en esta revisión no se ejecutó el frontend, la API ni sus suites de tests para probar su comportamiento de extremo a extremo.
- Los documentos históricos no siempre coinciden con el código actual. Para estado actual, priorizar `api/src`, `admin/src`, migraciones y la base local; usar `doc/` y `CAMBIOS.md` como historial y requisitos, comprobando sus afirmaciones contra el código.

## 1. Arquitectura y tecnologías

El repositorio contiene dos aplicaciones separadas y una base de datos local:

| Parte | Tecnologías verificadas en lockfiles/configuración |
|---|---|
| Admin | React 19.3.1, TypeScript 5.9.3, Vite 8.3.4, React Router 8.5.0, Material UI e iconos 9.5.0, Emotion 11.14.x. SPA con Vite. |
| API | Node.js 24.21.0 en el entorno observado, NestJS 12.1.0, TypeORM 1.1.1, `@nestjs/typeorm` 12.0.1, PostgreSQL driver `pg` 8.23.0, class-validator 0.15.1, class-transformer 0.5.1, Sharp 0.35.5. |
| Pruebas API | Vitest 4.1.11, `@nestjs/testing`, Supertest. |
| Base local | PostgreSQL 18 mediante Docker Compose. |

Las versiones de Node/npm describen este entorno de trabajo, no una política de versiones fijada por el proyecto. Los lockfiles son independientes: `admin/package-lock.json` y `api/package-lock.json`; no hay workspace npm en la raíz.

### Directorios

- `admin/src/pages/`: `Publications.tsx`, `Gallery.tsx`, `Clients.tsx`, `Skills.tsx`, `Settings.tsx`.
- `admin/src/components/`: componentes organizados por assets, clients, collections, contexts, layout, navigation, skills, tags, types y visualización de datos.
- `admin/src/hooks/`, `entities/`, `services/`, `views/`: estado y acceso a API, tipos del cliente, vistas y lógica de las pantallas.
- `api/src/app.module.ts`, `main.ts`: composición de Nest y arranque HTTP.
- `api/src/modules/`: módulos por recurso; cada módulo suele contener entidad, DTOs, servicio, controlador y módulo Nest.
- `api/src/database/data-source.ts` y `database/migrations/`: TypeORM y 36 migraciones.
- `api/test/`: prueba e2e de ejemplo. `api/src/modules/` contiene pruebas unitarias seleccionadas.
- `media/`: almacenamiento local compartido de archivos subidos.
- `doc/`, `CAMBIOS.md`: requisitos, decisiones e historial de pendientes, con algunas secciones antiguas.
- `postman/`: colección de solicitudes; contrastar rutas/cuerpos con controladores actuales.

### Docker Compose

[`docker-compose.yml`](docker-compose.yml) solo define el servicio `postgres`: imagen `postgres:18`, base `publicator`, puerto host `5432` y volumen persistente `postgres_data`. No define contenedores para Nest ni Vite. En la inspección, el contenedor `publicator-postgres-1` estaba `Up` y aceptó consultas SQL. El archivo Compose incluye valores de desarrollo para usuario/contraseña; no deben reutilizarse en producción.

## 2. Modelo de datos

El modelo actual tiene 21 entidades/tables de dominio. Cada entidad usa `id` como clave primaria identity. Las asociaciones se implementan como entidades explícitas cuando tienen atributos propios, restricciones o endpoints independientes. Los nombres de propiedades TypeScript son normalmente camelCase; las FK se mapean a columnas snake_case mediante `@JoinColumn`.

| Entidad / tabla | Atributos principales (tipos TypeORM/PostgreSQL) | Relaciones y restricciones relevantes |
|---|---|---|
| `Type` / `type` | `name` varchar NOT NULL | `name` único. |
| `Client` / `client` | `name` varchar(255) NOT NULL; `logo` varchar nullable | `name` único. |
| `Context` / `context` | `name` varchar NOT NULL | `name` único. |
| `Tag` / `tag` | `name` varchar NOT NULL | `name` único. |
| `Skill` / `skill` | `name` varchar NOT NULL; `icon` varchar nullable | `name` único. `icon` acepta ruta/URL como string; la API ofrece carga de SVG. |
| `SkillGroup` / `skill_group` | `name` varchar(100) NOT NULL; `description` text nullable | Catálogo global reutilizable. |
| `SkillGroupSkill` / `skill_group_skill` | `id`, FK `skillGroup`, FK `skill` | Ambas FK NOT NULL; pareja única. El borrado del grupo elimina sus asociaciones (`ON DELETE CASCADE`); la FK de `Skill` no declara cascade. |
| `PublicationSkillGroup` / `publication_skill_group` | `id`, FK `publication`, FK `skillGroup` | FKs NOT NULL; pareja publicación/grupo única. |
| `Dimensions` / `dimensions` | `width`, `height` integer NOT NULL | Pareja `(width,height)` única. |
| `Text` / `text` | `text` PostgreSQL text NOT NULL; `format` varchar NOT NULL | `format` limitado por CHECK a `PLAIN` o `MD`. |
| `Meta` / `meta` | `title` varchar, `slug` varchar, `date` date, `status` varchar, todos NOT NULL | `slug` único. FK opcional a `Client` (muchos metadatos pueden referir al cliente). `status` no tiene enum/CHECK en el modelo. |
| `Publication` / `publication` | FK `type`, FK `meta` | `type` NOT NULL muchos-a-uno; `meta` NOT NULL uno-a-uno, con FK `meta_id` única. Título/slug/status se guardan en `Meta`, no en `Publication`. |
| `Content` / `content` | `id`; FK `publication` nullable | Una publicación puede tener varios contenidos; la FK puede ser nula. |
| `TextContent` / `text_content` | `type` varchar NOT NULL; FK `content` NOT NULL; FK `text` nullable | Asociación de contenido y texto; no declara unicidad compuesta. |
| `Asset` / `asset` | `type` varchar, `url` text, `name` varchar nullable, `mimeType` varchar nullable, `sizeBytes` integer nullable, `uploadedAt` timestamptz nullable; FK `dimensions` nullable | `url` única. FK opcional a `Dimensions`; las dimensiones se reutilizan por ancho/alto. Los metadatos añadidos admiten null para compatibilidad con assets anteriores. |
| `AssetText` / `asset_text` | `type` varchar NOT NULL; FKs `asset`, `text` NOT NULL | `(asset,text,type)` único. |
| `Collection` / `collection` | `type` varchar NOT NULL; `position` integer NOT NULL; FK `publication` NOT NULL | Orden único por `(publication,position)`, constraint diferida inicialmente. `type` es texto libre. |
| `AssetCollection` / `asset_collection` | `role` varchar NOT NULL; `position` integer NOT NULL; FKs `collection`, `asset` NOT NULL | `(collection,asset,role)` único y `(collection,position)` único diferido inicialmente. El rol describe la asociación, no el MIME del archivo. |
| `PublicationAsset` / `publication_asset` | `role` varchar NOT NULL; FKs `publication`, `asset` NOT NULL | `(publication,asset,role)` único. Permite assets directos además de assets en colecciones. |
| `PublicationTag` / `publication_tag` | FKs `publication`, `tag` NOT NULL | Pareja publicación/tag única. |
| `PublicationContext` / `publication_context` | `position` integer NOT NULL; `visible`, `featured` boolean NOT NULL; FKs `publication`, `context` NOT NULL | Pareja publicación/contexto única; `(context,position)` único. |

Las otras relaciones son de cardinalidad varios-a-uno desde las entidades que contienen la FK. No se declaran relaciones inversas TypeORM por sistema. En general las FK no especifican `onDelete`; no asumir cascadas globales. La eliminación de una colección sí elimina explícitamente sus filas `AssetCollection` en `CollectionService` y conserva los assets.

### Diferencias modelo conceptual / relacional / actual

- `doc/FASE-1-CRUD-BASICO.md` describe una etapa anterior de 19 entidades y una tabla `Skills` asociada a publicaciones. El modelo implementado actual usa `Skill` como catálogo, `SkillGroup` global, `SkillGroupSkill` y `PublicationSkillGroup`; no hay entidad actual `Skills` registrada en TypeORM.
- El documento actual de `CAMBIOS.md` declara `SkillGroup` reutilizable. La migración `CreateReusableSkillGroups` migra cada antigua colección de skills a un grupo con nombre `Migrated skill group <id>` y descripción nula. Su `down` reconstruye asociaciones, pero no recupera nombres/descripciones ni el uso compartido del modelo nuevo.
- `URL` y `Format` no son tablas actuales. `Text.format` representa el formato de texto; `Asset.url` es una columna propia.
- `Publication` permite assets directos (`PublicationAsset`) y agrupaciones (`Collection` → `AssetCollection`). No hay regla que obligue a que una publicación tenga miniatura o asset principal.
- `role`, `Collection.type`, `TextContent.type`, `AssetText.type`, `Meta.status` y `Asset.type` son cadenas, salvo validación de aplicación donde exista. La base no establece vocabulario cerrado para estos campos, excepto el CHECK de `Text.format`.

## 3. Backend

### NestJS y TypeORM

- `AppModule` registra `ConfigModule.forRoot({ isGlobal: true })`, configuración PostgreSQL asíncrona vía `ConfigService` y los módulos de recursos.
- `TypeOrmModule` usa `autoLoadEntities: true`; no hay `synchronize` ni ejecución automática de migraciones. `data-source.ts` importa `dotenv/config`, usa `src/**/*.entity.ts` y `src/database/migrations/*.ts`.
- `main.ts` crea una aplicación Nest Express, crea el directorio de media, sirve archivos estáticos en `/media/`, instala `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`) y escucha `PORT` o `3000`. No define prefijo global `api`.
- Los controladores y DTOs siguen el patrón CRUD con `class-validator`; los errores incluyen `400`, `404` y, ante ciertas violaciones PostgreSQL `23505`, `409`.

### Módulos/controladores

Los 21 recursos de dominio tienen rutas CRUD genéricas `POST /<ruta>`, `GET /<ruta>`, `GET /<ruta>/:id`, `PATCH /<ruta>/:id` y `DELETE /<ruta>/:id`, salvo extensiones propias. Rutas raíz registradas:

`/assets`, `/asset-collections`, `/asset-texts`, `/clients`, `/collections`, `/contents`, `/contexts`, `/dimensions`, `/metadata`, `/publications`, `/publication-assets`, `/publication-contexts`, `/publication-skill-groups`, `/publication-tags`, `/skills`, `/skill-groups`, `/skill-group-skills`, `/tags`, `/texts`, `/text-contents`, `/types`.

Controladores principales en `api/src/modules/<recurso>/<recurso>.controller.ts`; entidades y servicios están junto a ellos. Los endpoints específicos actuales son:

- `PATCH /collections/order`: reordena la lista completa de IDs de una publicación.
- `PATCH /asset-collections/order`: reordena la lista completa de asociaciones de una colección.
- `POST /media/assets`: multipart `files`, hasta 50 archivos y 100 MB por archivo; admite SVG, JPG/JPEG, PNG, WebP, GIF, MP4, WebM, MP3, WAV, OGG y PDF. Crea un `Asset` por archivo; para imágenes intenta leer dimensiones con Sharp.
- `POST /media/clients/logos`: un archivo de imagen, máximo 5 MB.
- `POST /media/skills`: SVG, máximo 5 MB; guarda los archivos en `media/skills`.

La carga de assets compensa errores eliminando los registros y archivos creados durante esa petición. Las cargas de logos/icons devuelven una URL y no realizan el ciclo completo de persistencia/limpieza del registro relacionado.

### Migraciones y estado real

Hay 36 archivos de migración TypeORM en `api/src/database/migrations/`, desde `CreateType` hasta `AddCollectionAndAssetPositions`. La tabla `migrations` de PostgreSQL local contiene las 36; `npm run typeorm -- migration:show -d src/database/data-source.ts` también devolvió todas marcadas como aplicadas. Se consultó el esquema: 21 tablas de dominio más la tabla `migrations`.

Migraciones más relevantes para el estado actual: `CreatePublicationAsset`, `AddFormatToText`, `AddIconToSkill`, `RenameSkillsToPublicationSkills`, `AddLogoToClient`, `CreateReusableSkillGroups`, `AddAssetFileMetadata`, `AddAssetUploadedAt` y `AddCollectionAndAssetPositions`. La lista completa está en el directorio de migraciones.

Revisión a tener presente: `1790881752050-RemoveUrlTable.ts` y `1790881897399-RemoveFormatTable.ts` declaran ambos el sufijo de clase `1760000000000` (`RemoveUrlTable1760000000000` y `RemoveFormatTable1760000000000`), pese a tener nombres/fechas de archivo diferentes. Ambas aparecen aplicadas en la DB actual; revisar la convención/orden de timestamps antes de nuevas operaciones, sin editar migraciones aplicadas.

## 4. Frontend Admin

Es una SPA React/Vite con `BrowserRouter`, rutas `/publications`, `/gallery`, `/clients`, `/skills` y `/settings`; `/` redirige a `/publications`. `vite.config.ts` proxifica `/api` a `http://localhost:3000` quitando el prefijo, y proxifica `/media` sin reescritura. Esto permite que el backend exponga rutas sin prefijo durante el desarrollo. No hay proxy configurado fuera del servidor Vite.

La UI usa Material UI/Emotion, iconos MUI y CSS separado. Las páginas y funciones presentes incluyen:

- `Gallery.tsx`: administración de assets, carga múltiple, búsqueda/filtro por tipo, detalles, textos asociados, relaciones directas a publicaciones y vista de colecciones.
- `Collections.tsx` y componentes de `components/collections/`: filtros, lista, preview, formulario, editor y selección/reordenación de assets.
- `Clients.tsx`: gestión de clientes y logos.
- `Skills.tsx`: skills y grupos reutilizables; hay componentes de membresía y servicios para asociar skills.
- `Publications.tsx`: pestañas All/Types/Tags/Contexts. Types, Tags y Contexts montan vistas CRUD; la pestaña All solo muestra el texto `Publications`, aunque su botón anuncia creación. No es un flujo de Publications implementado.
- `Settings.tsx`: placeholder `<h1>Settings</h1>`.

Existen entidades frontend y servicios para recursos, pero no un cliente/experiencia pública separado identificado en el árbol actual. La existencia de componentes no demuestra que todos los flujos estén funcionando con la API; el build, las pantallas y las operaciones no se probaron en esta revisión.

## 5. Base de datos, configuración y desarrollo

Variables que usa API (`api/.env` y `api/.env.example`): `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`; opcionalmente el código lee `PORT` y `MEDIA_DIR`. No se reproducen valores de credenciales. El archivo `api/.env` local está presente y sus parámetros de conexión observados coinciden con Compose. En cambio, `api/.env.example` usa un usuario y contraseña distintos de los configurados en `docker-compose.yml`; al crear un entorno nuevo hay que alinear esas configuraciones.

Media se guarda en filesystem local bajo `media/` por defecto (o `MEDIA_DIR` si está definida), y se sirve estáticamente desde `/media/`. Compose solo monta volumen para PostgreSQL, no para media/API. En despliegues con contenedores la persistencia de archivos requiere una decisión/configuración adicional.

Flujo de desarrollo implícito por scripts:

1. Iniciar PostgreSQL con `docker compose up -d postgres`.
2. Configurar `api/.env` con parámetros que correspondan a la DB local; no copiar secretos a documentación.
3. API: `cd api && npm install && npm run start:dev`.
4. Admin: `cd admin && npm install && npm run dev`.
5. Migraciones: ejecutar explícitamente el script TypeORM desde `api/`; iniciar Nest no aplica migraciones.

Scripts disponibles: API `build`, `start:dev`, `start:prod`, `lint`, `test`, `test:e2e`, `test:cov`, `typeorm`; Admin `dev`, `build`, `lint`, `preview`.

## 6. Estado del proyecto

### Implementado y funcionando (verificado en este entorno)

- PostgreSQL 18 de Compose estaba activo y respondía a consultas.
- Las 36 migraciones aparecen aplicadas; el esquema consultado tiene las 21 tablas de dominio actuales.
- El archivo `.env` local permite consultar la base usando el DataSource de TypeORM. Esto verifica conexión/migraciones, no que la API HTTP o Admin estén levantados.

### Implementado pero pendiente de verificar

- CRUD Nest para los 21 recursos, upload de media, asociaciones de Publication y reordenamiento de colecciones/assets.
- Pantallas Admin de catálogo, clientes, skills, assets y collections.
- Build/lint y suites unitarias/e2e en el checkout actual. No se ejecutaron en esta revisión.
- Operaciones manuales de API/funciones UI contra la DB actual. Las migraciones aplicadas no prueban cada operación de negocio.
- El documento `CAMBIOS.md` afirma que el flujo de collections/assets del Admin está completo; el commit HEAD lo describe como pendiente de una primera revisión general. Tratarlo como código implementado que todavía requiere revisión funcional.

Hay pruebas unitarias para `asset`, `asset-collection`, `client`, `collection`, media, `publication-asset`, `skill-group`, `skill`, `text` y `type`. La prueba e2e visible solo valida `GET /` → `Hello World!`; no acredita los CRUD ni los flujos de Admin.

### Diseñado pero pendiente de implementar

- Flujo Admin de Publications: el endpoint/modelo backend existe, pero el tab `All` de `Publications.tsx` es placeholder. No está implementado el editor de publicación que coordine Meta, Type, Context, Tags, Content, Skills y Assets.
- `Settings` no tiene funcionalidad más allá del título.
- No se encuentra una aplicación pública de consumo separada ni endpoints de lectura especializados para una experiencia cliente en el código revisado; confirmar alcance antes de diseñarla.

### Pendiente de decidir

- Valores permitidos y transiciones del `Meta.status`; hoy solo es varchar sin catálogo/enum/CHECK.
- Política de autenticación/autorización y despliegue. No aparece implementación de auth en módulos ni configuración de producción en Compose.
- Estrategia de almacenamiento/limpieza de logos e iconos, y futuro traslado a S3; `doc/PENDIENTES-2.md` lo deja pendiente para logos de Client.
- La política de vocabulario de `role` y `type` libres: `CAMBIOS.md` confirma que los roles no son una lista cerrada y que los tipos de Collection son texto libre, pero falta decidir si el Admin necesita catálogo/validación adicional.

## 7. Decisiones técnicas

### Confirmadas por código o documentación

- PostgreSQL como almacén relacional y migraciones explícitas TypeORM; no `synchronize`.
- Backend Nest organizado por módulos/recurso y cliente Admin separado como SPA.
- Claves foráneas físicas snake_case y propiedades TS/JSON camelCase.
- Entidades de asociación cuando la relación lleva `role`, `type`, `position` o flags.
- `Text` es reutilizable y su `format` pertenece al texto, no a cada relación.
- `Asset.type` clasifica el formato de archivo; el `role` de cada relación representa el uso dentro de publicación/colección.
- Colecciones pertenecen a Publication; la posición de colecciones es única por publicación y la posición de assets por colección.
- Media se guarda localmente y se sirve con prefijo `/media/`.

### Inferencias que requieren confirmación

- La intención actual parece ser completar primero el Admin interno y luego desarrollar Publication; se deduce del título del commit HEAD y del placeholder de `Publications.tsx`.
- El proxy Vite sugiere desarrollo local same-origin; no demuestra la topología de producción.
- No observar auth/CORS/deployment en el checkout no prueba que no existan fuera de este repositorio.

## 8. Problemas pendientes y revisión

- Revisar de extremo a extremo el flujo recién desarrollado de Assets/Collections antes de ampliar Publications; validar estados de error, datos relacionados, orden y eliminaciones.
- `api/.env.example` no coincide con usuario/contraseña de Compose; corregir la documentación de entorno al preparar un nuevo setup.
- `doc/FASE-1-CRUD-BASICO.md` es histórico: afirma que no hay frontend y habla de 19 entidades; no representa este checkout. `admin/README.md` y `api/README.md` siguen siendo documentos plantilla Vite/Nest, no guías funcionales de Publicator.
- `doc/PENDIENTES.md` conserva anotaciones Postman históricas como verificaciones pendientes; comprobar cada una frente al código y pruebas actuales antes de asumir que aún aplica.
- `doc/PENDIENTES-OPCIONALES.md` deja como pregunta añadir descripción a SkillGroup, pero la entidad/migración actuales ya incluyen `description` nullable y la UI tiene formulario de grupo. Aclarar si el pendiente era solo decidir el uso/UX.
- `doc/PENDIENTES-2.md`: al cargar logo se puede dejar archivo huérfano al fallar la actualización o eliminar el Client; falta política de limpieza.
- Las migraciones `RemoveUrlTable` y `RemoveFormatTable` comparten timestamp en el nombre de clase; revisar con cautela aunque ambas están aplicadas en la DB observada.
- Las rutas `PATCH /collections/order` y `PATCH /asset-collections/order` esperan la lista completa de IDs exacta. La lógica tiene pruebas de servicio, pero no fue ejercitada HTTP/UI en esta sesión.
- Media no tiene volumen Compose propio. Los ficheros locales no forman parte del volumen PostgreSQL; documentar backup/persistencia para cualquier despliegue.
- Suite de pruebas de frontend ausente en scripts/package; el test e2e backend sigue siendo solo de ejemplo.

## 9. Punto exacto de continuidad

### Último trabajo

El commit HEAD `8f0d2f2` (`Admin: Flujo completo de Type / Tag / Context / Clients / Skills / Assets y Collection Assets, pendiente primera revision general antes de implementar publications`, 2026-10-29) añade el flujo de colecciones de Gallery, asociación y orden de assets, editor de textos/roles de assets, servicios y la migración de posiciones. El working tree estaba limpio antes de crear este documento.

### Archivos tocados en HEAD

Admin: `CAMBIOS.md`; `admin/src/components/assets/AssetTextsEditor.tsx`, `RoleCombobox.tsx`, `asset-texts-editor.css`, `asset-utils.ts`; componentes `admin/src/components/collections/CollectionAssetPicker.tsx`, `CollectionDeleteDialog.tsx`, `CollectionEditor.tsx`, `CollectionFilters.tsx`, `CollectionForm.tsx`, `CollectionList.tsx`, `CollectionThumbnail.tsx`, `collection-filter-types.ts`, `collection-format.ts`, `collections.css`; `admin/src/components/data-display/download-csv.ts`; `admin/src/constants/api-messages.ts`; `admin/src/entities/asset-text.ts`, `collection.ts`; `admin/src/hooks/useCollectionsData.ts`; `admin/src/pages/Gallery.tsx`; `admin/src/services/api-request.ts`, `asset-texts.service.ts`, `collections.service.ts`; `admin/src/views/Collections.tsx`, `admin/src/views/collections.css`.

API: `api/src/database/migrations/1793299056506-AddCollectionAndAssetPositions.ts`; en `api/src/modules/asset-collection/`: controller, service, spec, DTO `reorder-asset-collections.dto.ts` y entidad; en `api/src/modules/collection/`: controller, service, spec, DTO `reorder-collections.dto.ts` y entidad.

### Qué falta y siguiente paso concreto

La tarea incompleta explícita es la primera revisión general del flujo Assets/Collections, antes de implementar Publications. El siguiente paso recomendado es ejecutar Admin y API contra la DB local y revisar manualmente el ciclo de Collections/AssetCollections (crear, editar, ordenar, filtrar, borrar y comprobar persistencia/relaciones); luego ejecutar las pruebas/build pertinentes sin alterar migraciones ya aplicadas. Registrar cualquier corrección y solo entonces diseñar el formulario y flujo de publicación completo. `Publications.tsx` no es una implementación parcial del CRUD de publicación: su tab All sigue siendo placeholder.

## 10. Evidencia y límites de esta inspección

Se verificaron los archivos fuente, package manifests/lockfiles, configuración Docker, último commit, migraciones y esquema/migration table de la instancia Compose local. `migration:show` fue de solo lectura. No se ejecutaron builds, lint, pruebas, servidor API ni navegador; por tanto, el funcionamiento HTTP/UI y el estado visual no quedan certificados por este documento. No se inspeccionaron bases externas ni configuración fuera del repositorio.
