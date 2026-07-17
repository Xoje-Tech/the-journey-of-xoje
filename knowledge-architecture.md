# Arquitectura del Sistema de Conocimiento Unificado — The Journey of Xoje

Este documento presenta la propuesta definitiva para la **integración cohesiva de las 5 capas de memoria** del ecosistema Gentle AI. En lugar de ver a estas herramientas como islas aisladas o redundantes, las estructuramos como un sistema de conocimiento unificado donde cada capa cumple un rol específico en el ciclo de vida del desarrollo.

---

## 1. El Modelo de Memoria de Gentle AI (Las 5 Capas)

Para que un agente opere con la eficiencia de un desarrollador senior con años de experiencia, necesita diferentes tipos de memoria trabajando en sintonía:

```
                  ┌──────────────────────────────────────────┐
                  │          ENGRAM (Memoria Episódica)      │
                  │   - Decisiones de arquitectura           │
                  │   - Gotchas y lecciones de sesiones      │
                  └────────────────────┬─────────────────────┘
                                       │
      ┌────────────────────────────────┼────────────────────────────────┐
      ▼                                ▼                                ▼
┌──────────────────────────┐     ┌──────────────────────────┐     ┌──────────────────────────┐
│   CODEBASE-MEMORY-MCP    │     │       OKF BUNDLE         │     │         OPENSPEC         │
│   (Memoria Espacial/AST) │     │   (Memoria Declarativa)  │     │   (Memoria de Trabajo)   │
│ - Grafo de dependencias  │     │ - Datos del perfil       │     │ - Intención y requisitos │
│ - Rutas, tipos y llamadas│     │ - Experiencias y skills  │     │ - Scenarios Gherkin      │
│ - Análisis de impacto    │     │ - Evidencia técnica      │     │ - Tasks y estado de rama │
└─────────────┬────────────┘     └─────────────┬────────────┘     └─────────────┬────────────┘
              │                                │                                │
              └────────────────────────┬───────┴────────────────────────────────┘
                                       ▼
                         ┌──────────────────────────┐
                         │         OPENWIKI         │
                         │  (Memoria Reflexiva/CI)  │
                         │ - Linter de AGENTS.md    │
                         │ - Sincronizador de docs  │
                         │ - Guardián contra drift  │
                         └──────────────────────────┘
```

| Capa de Memoria | Tipo de Memoria Humana | Componente en el Ecosistema | Propósito y Contenido |
|---|---|---|---|
| **Engram** | **Episódica / Largo Plazo** | Servidor de base de datos global de observaciones (`title`/`topic_key`). | Almacena decisiones arquitectónicas globales, lecciones aprendidas de errores de compilación, gotchas específicos de versiones (Astro 6) y resúmenes de cierre de sesión. |
| **codebase-memory-mcp** | **Espacial / Estructural** | Grafo de conocimiento LSP local (Nodos AST, relaciones de llamada, importaciones). | Mapea la topología del código fuente. Resuelve instantáneamente dependencias, análisis de impacto de cambios y localización de símbolos sin saturar el contexto de texto. |
| **OKF (Open Knowledge Format)** | **Declarativa / Semántica** | Directorios `.knowledge/` o `.personal-brand/DATA` estructurados en JSON/Markdown. | El "Saber Qué". Contiene la información profesional del usuario (perfil, experiencias, habilidades, proyectos) y evidencias verificables para los guardarrailes. |
| **OpenSpec** | **Memoria de Trabajo (Working)**| Estructura `openspec/` local (proposals, specs, design, tasks, verify). | El "Saber Cómo". Define la intención activa de la rama de trabajo. Mantiene la trazabilidad de tareas y el estado de la implementación actual. |
| **OpenWiki** | **Reflexiva / Metacognitiva** | Linter de documentación y scripts de automatización. | Sincroniza y valida que la documentación estática (`AGENTS.md`, `SPEC.md`) no sufra "drift" (desviación) respecto al código real implementado y compilado. |

---

## 2. El Flujo de Trabajo Unificado y Cohesivo

La verdadera magia ocurre en la interacción. Así es como fluye una tarea de desarrollo típica (por ejemplo, el próximo **Slice de Traducción Bilingüe**) conectando todas las capas de forma limpia:

### Paso 1: Inicialización y Diagnóstico (`sdd-new` / `sdd-explore`)
- **OpenSpec** inicializa el estado del cambio en `openspec/changes/i18n-cv/`.
- **codebase-memory-mcp** es consultado para analizar qué archivos y componentes tocan la traducción de contenido (ej. `build-cv-static.mjs`, `CvDocument.astro`). Genera un reporte estructural de impacto en segundos.
- **Engram** es consultado mediante `mem_search` buscando lecciones de i18n pasadas (como la desactivación de `prefixDefaultLocale` de la PR #16). El agente recupera el contexto histórico instantáneamente.

### Paso 2: Especificación y Diseño (`sdd-spec` / `sdd-design`)
- **OpenSpec** redacta los escenarios Gherkin en `specs/` (ej. "Given data changes, When sync script runs with translate flag, Then English JSON updates").
- **OKF** provee las plantillas de datos y los requisitos de guardarrailes (ej. G04: no inventar métricas en la traducción).
- El diseño técnico en `design.md` referencia tanto la estructura espacial del código (desde `codebase-memory-mcp`) como las decisiones previas registradas en **Engram**.

### Paso 3: Implementación y Sincronización (`sdd-apply`)
- El agente implementa la funcionalidad guiado por las tareas de **OpenSpec**.
- Al interactuar con el código, si se descubre un gotcha técnico (por ejemplo, una limitación del traductor del LLM), se registra de forma proactiva en **Engram** con un `topic_key` único.
- El script de sincronización de datos actualiza el **OKF Bundle** y regenera los Markdowns de la colección.

### Paso 4: Verificación y Reflexión (`sdd-verify` / `sdd-archive`)
- **OpenSpec** valida que todos los tests unitarios y de integración de Vitest pasen en verde.
- **OpenWiki** se ejecuta en el pipeline pre-commit para:
  - Validar que los cambios en el enrutamiento o el build queden perfectamente documentados en `AGENTS.md` y `SPEC.md`.
  - Reportar cualquier inconsistencia o "drift" arquitectónico antes de subir la rama.
- **codebase-memory-mcp** vuelve a indexar el repositorio para capturar los nuevos nodos y relaciones en el AST.
- **Engram** persiste el `mem_session_summary` final, cerrando el ciclo. El cambio se archiva en disco.

---

## 3. Plan de Adopción e Integración Cohesiva

Para materializar esta arquitectura sin sobrecargar el flujo actual, ejecutaremos la adopción de forma orgánica:

### Fase A: Preparación de la Red (Sincronización OKF ↔ Snapshots)
- **Objetivo**: Limpiar la redundancia de datos entre `~/.personal-brand/DATA` y `tests/fixtures/portfolio/`.
- **Acción**: Refactorizar `sync-personal-brand-data.mjs` para que actúe como el puente bidireccional oficial del **OKF Bundle**. Con un comando (`--apply`), sincroniza y valida las firmas y esquemas de ambos lados de forma atómica.

### Fase B: Estabilización del Grafo (codebase-memory-mcp)
- **Objetivo**: Integrar la navegación espacial del porfolio.
- **Acción**: Resolver el ignore de la extensión `.astro` o los paths problemáticos en la configuración del indexador para que el análisis de impacto estructural empiece a operar de forma nativa en cada nueva tarea del dev-tracker.

### Fase C: El Guardián de la Verdad (Linter OpenWiki pre-commit)
- **Objetivo**: Eliminar el mantenimiento manual de la documentación.
- **Acción**: Crear un script liviano de OpenWiki que compare el árbol de archivos real contra los mapas declarados en `AGENTS.md`. Si un componente de juego se añade en `src/modules/game/` pero no se actualiza el mapa de componentes, el pre-commit bloquea y avisa.
