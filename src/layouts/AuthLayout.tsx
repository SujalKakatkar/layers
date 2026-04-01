import Loading from '@/loading/Loading'
import {useAuthStore} from '@/store/useAuthStore'
import {Outlet, Navigate} from 'react-router'

function AuthLayout () {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  if(loading) return <Loading />

  if(user) {
    return <Navigate to={'/dashboard'} />
  }

  return (
    <>
      <Outlet />
    </>
  )
}

export default AuthLayout
