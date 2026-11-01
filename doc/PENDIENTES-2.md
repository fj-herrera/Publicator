# Pendientes 2

## Clients

### Definir el ciclo de vida de los logos

**Estado: PENDIENTE**

Al subir un logo se crea primero el archivo en `media/clients/` y después se crea o actualiza el Client. Si falla el guardado, se reemplaza el logo o se elimina el Client, pueden quedar archivos sin referencia en la base de datos.

Definir e implementar más adelante una estrategia de limpieza para el almacenamiento local y mantenerla compatible con la futura migración a S3.

## Tarea pendiente: optimización del bundle de Admin

**Estado:** Pendiente  
**Prioridad:** Media  
**Momento previsto:** Después de validar el despliegue PRE.

### Situación actual

Durante la compilación de Admin (`npm run build`), Vite generó correctamente el directorio `dist`, pero mostró el siguiente aviso:

- Bundle JavaScript principal: **707 kB minificado**.
- Umbral recomendado por Vite: **500 kB**.

La compilación terminó correctamente. No es un error bloqueante ni impide el despliegue.

### Trabajo pendiente

1. Analizar el contenido del bundle para identificar qué dependencias y módulos contribuyen más a su tamaño.
2. Revisar las posibilidades de división de código (*code splitting*).
3. Evaluar la carga diferida de páginas y componentes mediante `React.lazy` y `Suspense` cuando corresponda.
4. Revisar la configuración de `manualChunks` de Vite si resulta conveniente.
5. Volver a ejecutar `npm run build` y comparar los resultados.

### Criterio de cierre

La tarea no se considera resuelta hasta haber revisado el análisis del bundle, aplicado las optimizaciones justificadas y comprobado el nuevo tamaño generado.

**Nota:** No realizar optimizaciones arbitrarias únicamente para eliminar el aviso de Vite. Priorizar una división de código coherente con la arquitectura del Admin.