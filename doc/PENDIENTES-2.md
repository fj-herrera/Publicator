# Pendientes 2

## Clients

### Definir el ciclo de vida de los logos

**Estado: PENDIENTE**

Al subir un logo se crea primero el archivo en `media/clients/` y después se crea o actualiza el Client. Si falla el guardado, se reemplaza el logo o se elimina el Client, pueden quedar archivos sin referencia en la base de datos.

Definir e implementar más adelante una estrategia de limpieza para el almacenamiento local y mantenerla compatible con la futura migración a S3.