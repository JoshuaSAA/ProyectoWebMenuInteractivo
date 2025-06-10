import { BrowserRouter, Routes, Route } from "react-router-dom";
import Cocina from "./Cocina";
import MenuInteractivo from "./menuInteractivo";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuInteractivo />} />
        <Route path="/cocina" element={<Cocina />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;