<template>
  <section class="space-y-8">
    <div>
      <p class="font-semibold text-teal-700">
        Administración
      </p>
      <h1 class="mt-2 text-3xl font-bold text-slate-950">
        Servicios y módulos
      </h1>
      <p class="mt-2 text-slate-600">
        Da de alta los servicios que se atienden y los módulos (ventanillas) que los atienden.
      </p>
    </div>

    <p
      v-if="!auth.isAuthenticated"
      class="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      Necesitas iniciar sesión como administrador para crear o editar.
    </p>

    <div class="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div class="rounded-lg border border-slate-200 bg-white">
        <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 class="text-lg font-semibold text-slate-950">
            Servicios
          </h2>
          <span class="text-sm text-slate-500">{{ catalog.services.length }} en total</span>
        </div>

        <p v-if="catalog.servicesError" class="m-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ catalog.servicesError }}
        </p>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-600">
              <tr>
                <th class="px-4 py-2 font-medium">Prefijo</th>
                <th class="px-4 py-2 font-medium">Nombre</th>
                <th class="px-4 py-2 font-medium">Estado</th>
                <th class="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              <tr v-if="catalog.loadingServices">
                <td colspan="4" class="px-4 py-6 text-center text-slate-500">Cargando servicios…</td>
              </tr>
              <tr v-else-if="catalog.services.length === 0">
                <td colspan="4" class="px-4 py-6 text-center text-slate-500">Todavía no hay servicios.</td>
              </tr>
              <tr
                v-for="service in catalog.services"
                v-else
                :key="service.id"
                class="border-t border-slate-100"
                :class="{ 'bg-teal-50': serviceForm.id === service.id }"
              >
                <td class="px-4 py-2">
                  <span class="grid size-8 place-items-center rounded bg-slate-900 font-bold text-white">
                    {{ service.prefix }}
                  </span>
                </td>
                <td class="px-4 py-2 font-medium text-slate-900">{{ service.name }}</td>
                <td class="px-4 py-2">
                  <span :class="badgeClass(service.active)">{{ service.active ? 'Activo' : 'Inactivo' }}</span>
                </td>
                <td class="px-4 py-2 text-right">
                  <button
                    class="focus-ring rounded px-3 py-1 font-medium text-teal-700 hover:bg-teal-50 disabled:text-slate-400"
                    type="button"
                    :disabled="!auth.isAuthenticated"
                    @click="editService(service)"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <form class="space-y-4 rounded-lg border border-slate-200 bg-white p-4" @submit.prevent="submitService">
        <h2 class="text-lg font-semibold text-slate-950">
          {{ serviceForm.id ? 'Editar servicio' : 'Nuevo servicio' }}
        </h2>

        <label class="block text-sm">
          <span class="font-medium text-slate-700">Nombre</span>
          <input
            v-model="serviceForm.name"
            class="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            type="text"
            minlength="2"
            maxlength="60"
            required
            placeholder="Caja"
          >
        </label>

        <label class="block text-sm">
          <span class="font-medium text-slate-700">Prefijo</span>
          <input
            :value="serviceForm.prefix"
            class="focus-ring mt-1 w-20 rounded border border-slate-300 px-3 py-2 text-center font-bold uppercase"
            type="text"
            maxlength="1"
            pattern="[A-Z]"
            required
            placeholder="A"
            @input="onPrefixInput"
          >
          <span class="mt-1 block text-xs text-slate-500">Una letra mayúscula, no se puede repetir.</span>
        </label>

        <label class="flex items-center gap-2 text-sm">
          <input v-model="serviceForm.active" type="checkbox" class="size-4 accent-teal-600">
          <span class="font-medium text-slate-700">Activo</span>
        </label>

        <p v-if="serviceForm.error" class="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ serviceForm.error }}
        </p>
        <p v-if="serviceForm.success" class="rounded border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {{ serviceForm.success }}
        </p>

        <div class="flex gap-2">
          <button
            class="focus-ring rounded bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 disabled:bg-slate-300"
            type="submit"
            :disabled="serviceForm.saving || !auth.isAuthenticated"
          >
            {{ serviceForm.saving ? 'Guardando…' : serviceForm.id ? 'Guardar cambios' : 'Crear servicio' }}
          </button>
          <button
            v-if="serviceForm.id"
            class="focus-ring rounded px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
            type="button"
            @click="resetServiceForm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>

    <div class="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div class="rounded-lg border border-slate-200 bg-white">
        <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 class="text-lg font-semibold text-slate-950">
            Módulos
          </h2>
          <span class="text-sm text-slate-500">{{ catalog.counters.length }} en total</span>
        </div>

        <p v-if="catalog.countersError" class="m-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ catalog.countersError }}
        </p>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-600">
              <tr>
                <th class="px-4 py-2 font-medium">Nombre</th>
                <th class="px-4 py-2 font-medium">Servicios que atiende</th>
                <th class="px-4 py-2 font-medium">Estado</th>
                <th class="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              <tr v-if="catalog.loadingCounters">
                <td colspan="4" class="px-4 py-6 text-center text-slate-500">Cargando módulos…</td>
              </tr>
              <tr v-else-if="catalog.counters.length === 0">
                <td colspan="4" class="px-4 py-6 text-center text-slate-500">
                  {{ auth.isAuthenticated ? 'Todavía no hay módulos.' : 'Inicia sesión para ver los módulos.' }}
                </td>
              </tr>
              <tr
                v-for="counter in catalog.counters"
                v-else
                :key="counter.id"
                class="border-t border-slate-100"
                :class="{ 'bg-teal-50': counterForm.id === counter.id }"
              >
                <td class="px-4 py-2 font-medium text-slate-900">{{ counter.name }}</td>
                <td class="px-4 py-2">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="serviceId in counter.serviceIds"
                      :key="serviceId"
                      class="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                    >
                      {{ catalog.serviceName(serviceId) }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-2">
                  <span :class="badgeClass(counter.active)">{{ counter.active ? 'Activo' : 'Inactivo' }}</span>
                </td>
                <td class="px-4 py-2 text-right">
                  <button
                    class="focus-ring rounded px-3 py-1 font-medium text-teal-700 hover:bg-teal-50"
                    type="button"
                    @click="editCounter(counter)"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <form class="space-y-4 rounded-lg border border-slate-200 bg-white p-4" @submit.prevent="submitCounter">
        <h2 class="text-lg font-semibold text-slate-950">
          {{ counterForm.id ? 'Editar módulo' : 'Nuevo módulo' }}
        </h2>

        <label class="block text-sm">
          <span class="font-medium text-slate-700">Nombre</span>
          <input
            v-model="counterForm.name"
            class="focus-ring mt-1 w-full rounded border border-slate-300 px-3 py-2"
            type="text"
            minlength="2"
            maxlength="60"
            required
            placeholder="Módulo 1"
          >
        </label>

        <fieldset class="text-sm">
          <legend class="font-medium text-slate-700">Servicios que atiende</legend>
          <p v-if="catalog.services.length === 0" class="mt-1 text-slate-500">
            Primero crea un servicio.
          </p>
          <div class="mt-2 space-y-1">
            <label
              v-for="service in catalog.services"
              :key="service.id"
              class="flex items-center gap-2"
            >
              <input
                v-model="counterForm.serviceIds"
                type="checkbox"
                class="size-4 accent-teal-600"
                :value="service.id"
              >
              <span>{{ service.prefix }} · {{ service.name }}</span>
              <span v-if="!service.active" class="text-xs text-slate-400">(inactivo)</span>
            </label>
          </div>
        </fieldset>

        <label class="flex items-center gap-2 text-sm">
          <input v-model="counterForm.active" type="checkbox" class="size-4 accent-teal-600">
          <span class="font-medium text-slate-700">Activo</span>
        </label>

        <p v-if="counterForm.error" class="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ counterForm.error }}
        </p>
        <p v-if="counterForm.success" class="rounded border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {{ counterForm.success }}
        </p>

        <div class="flex gap-2">
          <button
            class="focus-ring rounded bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 disabled:bg-slate-300"
            type="submit"
            :disabled="counterForm.saving || !auth.isAuthenticated"
          >
            {{ counterForm.saving ? 'Guardando…' : counterForm.id ? 'Guardar cambios' : 'Crear módulo' }}
          </button>
          <button
            v-if="counterForm.id"
            class="focus-ring rounded px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
            type="button"
            @click="resetCounterForm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Counter, Service } from '~/types/api'

definePageMeta({
  middleware: 'admin'
})

const auth = useAuthStore()
const catalog = useCatalogStore()

const serviceForm = reactive({
  id: '',
  name: '',
  prefix: '',
  active: true,
  saving: false,
  error: '',
  success: ''
})

const counterForm = reactive({
  id: '',
  name: '',
  serviceIds: [] as string[],
  active: true,
  saving: false,
  error: '',
  success: ''
})

function badgeClass(active: boolean) {
  return active
    ? 'rounded bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800'
    : 'rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'
}

function onPrefixInput(event: Event) {
  const input = event.target as HTMLInputElement
  serviceForm.prefix = input.value.toUpperCase()
  input.value = serviceForm.prefix
}

function resetServiceForm() {
  Object.assign(serviceForm, { id: '', name: '', prefix: '', active: true, error: '' })
}

function editService(service: Service) {
  Object.assign(serviceForm, {
    id: service.id,
    name: service.name,
    prefix: service.prefix,
    active: service.active,
    error: '',
    success: ''
  })
}

async function submitService() {
  serviceForm.saving = true
  serviceForm.error = ''
  serviceForm.success = ''

  const payload = {
    name: serviceForm.name.trim(),
    prefix: serviceForm.prefix.trim(),
    active: serviceForm.active
  }

  try {
    if (serviceForm.id) {
      const updated = await catalog.updateService(serviceForm.id, payload)
      resetServiceForm()
      serviceForm.success = `Servicio ${updated.prefix} · ${updated.name} actualizado.`
    } else {
      const created = await catalog.createService(payload)
      resetServiceForm()
      serviceForm.success = `Servicio ${created.prefix} · ${created.name} creado.`
    }
  } catch (error) {
    serviceForm.error = (error as Error).message
  } finally {
    serviceForm.saving = false
  }
}

function resetCounterForm() {
  Object.assign(counterForm, { id: '', name: '', serviceIds: [], active: true, error: '' })
}

function editCounter(counter: Counter) {
  Object.assign(counterForm, {
    id: counter.id,
    name: counter.name,
    serviceIds: [...counter.serviceIds],
    active: counter.active,
    error: '',
    success: ''
  })
}

async function submitCounter() {
  counterForm.error = ''
  counterForm.success = ''

  if (counterForm.serviceIds.length === 0) {
    counterForm.error = 'Selecciona al menos un servicio.'
    return
  }

  counterForm.saving = true

  const payload = {
    name: counterForm.name.trim(),
    serviceIds: [...counterForm.serviceIds],
    active: counterForm.active
  }

  try {
    if (counterForm.id) {
      const updated = await catalog.updateCounter(counterForm.id, payload)
      resetCounterForm()
      counterForm.success = `${updated.name} actualizado.`
    } else {
      const created = await catalog.createCounter(payload)
      resetCounterForm()
      counterForm.success = `${created.name} creado.`
    }
  } catch (error) {
    counterForm.error = (error as Error).message
  } finally {
    counterForm.saving = false
  }
}

onMounted(async () => {
  if (!auth.accessToken) {
    auth.restoreSession()
  }

  await catalog.fetchServices()

  if (auth.isAuthenticated) {
    await catalog.fetchCounters()
  }
})
</script>
