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

## Assets y archivos multimedia

- `Asset` conserva `type`, `url` y la relación opcional con `Dimensions`, y añade `name`, `mimeType`, `sizeBytes` y `uploadedAt` para guardar el nombre original, el MIME detectado, el tamaño y la fecha de alta.
- Los campos nuevos son nullable para mantener compatibles los assets creados antes de esta ampliación.
- En la subida, las dimensiones de archivos de imagen se leen del binario. El sistema reutiliza la entrada `Dimensions` existente para ese ancho y alto, o la crea si no existe, y asocia el asset al registro. No se piden como dato manual; quedan como metadata de consulta para el front público. Otros formatos quedan sin dimensiones detectadas.
- `Asset.type` se obtiene del MIME y clasifica el archivo como `Image`, `Video`, `Audio` o `Document`. No representa el uso del recurso en el contenido.
- Se admiten SVG, JPG/JPEG, PNG, WebP, GIF, MP4, WebM, MP3, WAV, OGG y PDF. La subida múltiple admite hasta 50 archivos por petición y limita cada archivo a 100 MB.
- `POST /media/assets` recibe los archivos en el campo multipart `files`, guarda cada uno en `media/assets/` y crea un registro global de `Asset` por archivo. `Asset.url` contiene la ruta pública y el archivo queda disponible bajo `/media/assets/`.
- `PublicationAsset.role` y `AssetCollection.role` guardan roles configurables de cada asociación. El role depende del destino y no del tipo o MIME del archivo.
- La edición de un asset permite cambiar `name` sin renombrar ni sustituir el archivo almacenado, y modificar el `role` de cada relación directa con una publicación. Las relaciones con colecciones se muestran en este formulario, pero se editan desde la colección.
- `GET /publication-assets` incluye `publication.meta` para mostrar título y slug junto a cada relación.
- La migración `1793131976006-AddAssetFileMetadata` añade las columnas nullable `name`, `mime_type` y `size_bytes`. La migración `1793131976007-AddAssetUploadedAt` añade `uploaded_at`. Ambas conservan los datos existentes; los assets anteriores sin fecha permanecen con `uploaded_at` nulo.

**Estado de las migraciones:** ambas ejecutadas en el entorno de desarrollo actual.