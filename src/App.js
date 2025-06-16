import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Write from "./components/Write";
import Login from "./components/log";
import Muestras from "./components/Muestras";
import Reporte from "./components/ReportesMuestra";
import OperarioMuestras from "./components/OperarioMuetras";
import "./index.css"
import FormularioRegistroUsuario from "./components/Registro";
import AdminDashboard from "./components/Admi";
import OperarioDashboard from "./components/Operario";
import MacroLecturas from "./components/Macro";
import ReporteMacros from "./components/ReporteMacros";
import OrdenRegistro from "./components/Reparaciones";
import AdminOrdenes from "./components/OrdenAdmi";
import NivelTanque from "./components/NivelTanque";
import OpeNivelTanque from "./components/OpeTanque.js";
import OpeMacroLecturas from "./components/OpeMacro";


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
        <Route path="/OperarioMacros" element={<OpeMacroLecturas />} />
        <Route path="/Admi" element={<AdminDashboard />} />
        <Route path="/OperarioDashboard" element={<OperarioDashboard />} />
        <Route path="/Macros" element={<MacroLecturas />} />
        <Route path="/Orden" element={<OrdenRegistro />} />
        <Route path="/ReporteMacros" element={<ReporteMacros />} />
        <Route path="/AdmiOrden" element={<AdminOrdenes />} />
        <Route path="/NivelTanque" element={<NivelTanque />} />
        <Route path="/OperarioNivelTanque" element={<OpeNivelTanque />} />
      </Routes>
    </Router>
  );
}

export default App;
