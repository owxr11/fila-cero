<template>
  <div
    v-if="organization"
    class="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3"
  >
    <p class="text-lg font-bold text-teal-900">
      {{ organization.name }}
    </p>
    <p v-if="organization.message" class="mt-1 text-teal-800">
      {{ organization.message }}
    </p>
    <p
      v-if="organization.schedule || organization.address"
      class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-teal-700"
    >
      <span v-if="organization.schedule">Horario: {{ organization.schedule }}</span>
      <span v-if="organization.address">{{ organization.address }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
const store = useOrganizationStore()
const organization = computed(() => store.organization)

onMounted(() => {
  if (!store.organization) {
    store.fetchOrganization()
  }
})
</script>
