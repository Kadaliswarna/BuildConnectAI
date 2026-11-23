import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import Home from './pages/Home'
import Builders from './pages/Builders'
import Workers from './pages/Workers'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Estimator from './pages/Estimator'
import Materials from './pages/Materials'
import Support from './pages/Support'
import Assistant from './pages/Assistant'
import ComingSoon from './pages/ComingSoon'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="builders" element={<Builders />} />
          <Route path="workers" element={<Workers />} />
          <Route path="track" element={<Projects />} />
          <Route path="estimator" element={<Estimator />} />
          <Route path="materials" element={<Materials />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="support" element={<Support />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="messages" element={<RequireAuth><Dashboard initialTab="messages" /></RequireAuth>} />
          <Route path="*" element={<ComingSoon titleKey="Home" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
