import { useState } from "react";
import Lobby from "./components/lobby/Lobby";
import Main from "./components/master/Main";
import NotFound from "./components/NotFound/NotFound";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/home" element={<Main />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
