<template>
  <section class="space-y-4">
    <div>
      <p class="font-semibold text-teal-700">
        Administración
      </p>
      <h1 class="mt-2 text-3xl font-bold text-slate-950">
        Servicios y módulos
      </h1>
    </div>

    <p class="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      Pendiente (Integrante 2): Crear, listar y editar servicios y módulos de atención (/services y /counters).
    </p>
  </section>
</template>

<script setup lang="ts">
// integrante 2
definePageMeta({
  middleware: 'admin'
})
</script>
