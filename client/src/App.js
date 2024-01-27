import React from 'react'
import Form from './modules/Form'
import Dashboard from './modules/Dashboard'
import { Route, Routes, Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, auth=false }) => {
  const isLoggedIn = localStorage.getItem('user:token') !== null || false;

  if (!isLoggedIn && auth) {
    return <Navigate to={'/users/sign_in'} />
  } else if (isLoggedIn && ['/users/sign_in', '/users/sign_up'].includes(window.location.pathname)) {
    return <Navigate to={'/'} />
  }

  return children
}

const App = () => {
  return (
    // <div className='bg-[#e1edff] h-screen flex justify-center items-center'>
    //   <Form />
    //   <Dashboard />
    // </div>
    <Routes>
      <Route path='/' element={
        <ProtectedRoute auth={true}>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path='/users/sign_in' element={
        <ProtectedRoute>
          <Form isSignInPage={true} />
        </ProtectedRoute>
        } />
      <Route path='/users/sign_up' element={
        <ProtectedRoute>
          <Form isSignInPage={false} />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

export default App