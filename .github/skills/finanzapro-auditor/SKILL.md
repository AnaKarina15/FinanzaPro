---
name: financapro-auditor
user-invocable: true
description: "Skill de proyecto para FinanzaPro: guia al agente a implementar cambios respetando MVC puro, inmutabilidad, RBAC, validación de variables protegidas y respuestas JSON en controladores AJAX."
applyTo:
  - "**/*.php"
---

# Skill FinanzaPro Auditor

## Propósito

Esta skill define el flujo de trabajo de FinanzaPro para implementar cambios en PHP sin alterar identificadores existentes, manteniendo la separación estricta entre controlador y modelo, y asegurando el uso seguro de PDO y JSON para AJAX.

## Flujo de trabajo

1. Auditar todas las variables protegidas en el código existente.
   - Buscar `$_POST`, `$_GET`, `$_SESSION`.
   - Buscar accesos directos a arrays con `['clave']`.
   - Buscar strings literales SQL y columnas usadas en consultas existentes.

2. Enumerar los elementos detectados en una lista numerada uno por línea.

3. Verificar compatibilidad con el manifiesto y los 7 pasos del prompt:
   - No lógica de negocio en el controlador.
   - Cero SQL fuera del modelo.
   - Respuesta JSON estructurada en el controlador para AJAX.
   - El modelo valida reglas de negocio y retorna arrays asociativos.
   - No renombrar columnas o claves legadas.
   - No redeclarar / ocultar variables críticas.
   - No cambiar el orden de parámetros en llamadas relevantes.

4. Implementar la solución con nombres nuevos 100% en español técnico.

5. Verificar explícitamente la coincidencia entre el conteo de elementos detectados y los utilizados.
   - Si hay discrepancia, descartar el código y activar el failsafe.

## Criterios obligatorios

- Controlador: recibe datos AJAX, delega validaciones al modelo y emite `json_encode([...])` + `exit;`.
- Modelo: único lugar del SQL, usa PDO con `prepare` y `execute`, retorna `PDO::FETCH_ASSOC`.
- Sesión: almacenar solo identidad ligera (`id_usuario`, `rol`, etc.), nunca el objeto `Usuario` completo.
- Seguridad: sin concatenaciones SQL, sin `fetch` que no sea asociativo.
- Idioma: comentarios, variables nuevas, métodos nuevos y documentación en español.

## Formato de salida

Cuando el usuario pida cambios o implementación, responder siempre con:

1. **REPORTE DE AUDITORÍA:** lista numerada de variables protegidas detectadas.
2. **IMPLEMENTACIÓN TÉCNICA:** rutas sugeridas y bloques de código PHP separados por capa.
3. **PROTOCOLO DE INTEGRACIÓN Y VALIDACIÓN FINAL:** descripción del flujo y `Detectadas [N] vs Utilizadas [N]`.

## Ejemplo de uso

- "Implementar un nuevo endpoint AJAX para registrar ingreso/gasto respetando la arquitectura MVC."
- "Agregar validación de PIN de seguridad en el modelo y respuesta JSON en el controlador."
- "Auditar y corregir el flujo de cambio de contraseña sin tocar columnas de base de datos legadas."
