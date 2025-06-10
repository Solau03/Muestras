import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Write from "./components/Write";
import Login from "./components/log";
import Muestras from "./components/Muestras";
import Reporte from "./components/ReportesMuestra";
import OperarioMuestras from "./components/OperarioMuetras";
import "./index.css"
import FormularioRegistroUsuario from "./components/Registro";
import AdminDashboard from "./components/Admi";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/log" element={<Login />} />
        <Route path="/Usuarios" element={<FormularioRegistroUsuario />} />
        <Route path="/Muestras" element={<Muestras />} />
        <Route path="/MuestrasReportes" element={<Reporte />} />
        <Route path="/OperarioMuestras" element={<OperarioMuestras />} />
        <Route path="/Admi" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
