import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Write from "./components/Write";
import Login from "./components/log";
import Muestras from "./components/Muestras";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Write />} />
        <Route path="/log" element={<Login />} />
        <Route path="/Muestras" element={<Muestras />} />
      </Routes>
    </Router>
  );
}

export default App;
