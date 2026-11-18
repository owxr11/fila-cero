// Requiere sesión iniciada (cualquier rol)
export default defineNuxtRouteMiddleware((to) => {
  // La sesión vive en localStorage: solo se puede revisar en el navegador
  if (import.meta.server) {
    return
  }

  const auth = useAuthStore()
  auth.restoreSession()

  if (!auth.isAuthenticated) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
