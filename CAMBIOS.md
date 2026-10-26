# Cambios

## Skill Groups reutilizables

- `SkillGroup` es el catálogo global con nombre y descripción.
- `SkillGroupSkill` relaciona cada grupo con las skills que contiene.
- `PublicationSkillGroup` relaciona publicaciones con grupos reutilizables.
- `GET /skill-groups` devuelve cada grupo con sus skills y el número de publicaciones que lo usan.
- La migración `1792321248117-CreateReusableSkillGroups` convierte cada colección antigua `PublicationSkills` en un grupo `Migrated skill group <id>`, conserva sus skills y su publicación, y elimina las tablas antiguas.
- Los grupos migrados quedan con descripción vacía para que puedan editarse desde el admin.
- El `down` reconstruye las asociaciones antiguas, pero no puede recuperar nombres/descripciones ni la reutilización global, porque esos datos no existían en el esquema previo.
- El admin implementa el formulario y el DataGrid de la primera pantalla; el drag-and-drop de pertenencia queda pendiente.

**Estado de la migración:** pendiente de revisión y ejecución. Antes de producción, revisar los nombres temporales de grupos migrados y respaldar la base de datos.