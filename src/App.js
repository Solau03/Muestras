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
import RegistroVisitas from "./components/Bocatoma.js";
import RegistroCloroPH from "./components/Manzano.js";
import AdmiRegistroVisitas from "./components/AdmiManzano.js";
import ReportesManzano from "./components/ReportesManzano.js";
import BocDashboard from "./components/Boc.js";
import VisualizacionRegistros from "./components/AdmiBocatoma.js";
import AdmiRegistroCloroPH from "./components/AdmiManzano.js";
import AdmiNivelTanque from "./components/AdmiTanque.js";
import ReportesNivelTanque from "./components/ReporteTanque.js";
import BocNivelTanque from "./components/BocTanque.js";
import BocMuestras from "./components/BocMuestras.js";
import BocMacroLecturas from "./components/BocMacros.js";
import BocRegistroOrden from "./components/BocReparaciones.js";

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
        <Route path="/Bocatoma" element={<RegistroVisitas />} />
         <Route path="/Manzano" element={<RegistroCloroPH />} />
         <Route path="/AdmiManzano" element={<AdmiRegistroCloroPH />} />
         <Route path="/ReportesManzano" element={<ReportesManzano />} />
         <Route path="/BocatomaDashboard" element={<BocDashboard />} />
         <Route path="/AdmiBocatoma" element={<VisualizacionRegistros />} />
         <Route path="/AdmiTanque" element={<AdmiNivelTanque />} />
         <Route path="/ReporteTanque" element={<ReportesNivelTanque />} />
         <Route path="/BocTanque" element={<BocNivelTanque />} />
         <Route path="/BocMuestra" element={<BocMuestras />} />
         <Route path="/BocMacro" element={<BocMacroLecturas />} />
         <Route path="/BocOrdenes" element={<BocRegistroOrden />} />
      </Routes>
    </Router>
  );
}

export default App;
