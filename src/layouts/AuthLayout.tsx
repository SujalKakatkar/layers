import Loading from '@/loading/Loading'
import {useAuthStore} from '@/store/useAuthStore'
import {Outlet, Navigate} from 'react-router'

function AuthLayout () {
 

  return (
    <>
      <Outlet />
    </>
  )
}

export default AuthLayout
