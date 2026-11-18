// OPERATOR o ADMIN
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) {
    return
  }

  const auth = useAuthStore()
  auth.restoreSession()

  if (!auth.isAuthenticated) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (!auth.isOperator) {
    return navigateTo('/')
  }
})
