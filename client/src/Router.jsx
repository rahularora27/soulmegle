import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './app/App';
import Lobby from './components/lobby/Lobby';
import NotFound from './components/notfound/NotFound';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/home" element={<App />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
