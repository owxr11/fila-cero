<template>
  <section class="space-y-4">
    <div>
      <p class="font-semibold text-teal-700">
        Operador
      </p>
      <h1 class="mt-2 text-3xl font-bold text-slate-950">
        Panel de operador
      </h1>
    </div>

    <p class="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      Pendiente (Integrante 4): Pantalla base del operador. En R2 se agregan las acciones llamar, iniciar y finalizar.
    </p>
  </section>
</template>

<script setup lang="ts">
// integrante 4
definePageMeta({
  middleware: 'operator'
})
</script>
