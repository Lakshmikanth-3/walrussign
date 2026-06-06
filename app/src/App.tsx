import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Sign from './pages/Sign'
import Verify from './pages/Verify'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/sign/:objectId" element={<Sign />} />
      <Route path="/verify/:objectId" element={<Verify />} />
    </Routes>
  )
}
