---
description: Toma la próxima tarea sin marcar de TASKS.md (del stage más bajo disponible) y la implementa.
---

Leé `TASKS.md` completo. Encontrá el stage más bajo que todavía tenga ítems sin marcar (`[ ]` o `🔶`) y, dentro de ese stage, el primer ítem sin marcar en el orden en que aparece.

Antes de empezar:
- Confirmá que las tareas de las que depende (stages anteriores) están resueltas — si no, avisá y proponé empezar por ahí en cambio.
- Repasá `CLAUDE.md` para las reglas de arquitectura que no se negocian.

Implementá esa tarea sola (no varias a la vez), siguiendo el patrón ya armado en `apps/backend/src/catalogo/` si es una tarea de backend. Al terminar:

1. Marcá el ítem con `[x]` en `TASKS.md`.
2. Resumí en un párrafo qué se hizo y qué falta (si algo quedó a mitad).
3. Sugerí el mensaje de commit y el nombre de rama (`feature/nombre-de-la-tarea`), pero no hagas commit ni push vos mismo salvo que se te pida explícitamente.
