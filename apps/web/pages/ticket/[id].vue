<template>
  <section class="space-y-4">
    <div>
      <p class="font-semibold text-teal-700">
        Mi turno
      </p>
      <h1 class="mt-2 text-3xl font-bold text-slate-950">
        Estado de tu turno
      </h1>
    </div>

    <p class="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      Pendiente (Integrante 4): Mostrar código, estado y personas delante (GET /queue/tickets/:id). Vista pensada para celular.
    </p>
    <p class="mt-4 font-mono text-sm text-slate-500">
      Ticket: {{ ticketId }}
    </p>
  </section>
</template>

<script setup lang="ts">
// integrante 4
const route = useRoute()
const ticketId = computed(() => String(route.params.id))
</script>
