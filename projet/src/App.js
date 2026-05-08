import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LoginMedecin from './pages/LoginMedecin';
import DashboardMedecin from './pages/DashboardMedecin';
import LoginPatient from './pages/LoginPatient'; // Nouvelle page
import DashboardPatient from './pages/DashboardPatient'; // Nouvelle page
import Contact from './pages/contact'

// Dans ton <Routes> :

function App() {
  return (
    <Router>
      <Routes>
        {/* Accueil */}
        <Route path="/" element={<Home />} />
        
        <Route path="/contact" element={<Contact />} />

        {/* Espace Médecin */}
        <Route path="/login-medecin" element={<LoginMedecin />} />
        <Route path="/dashboard-medecin" element={<DashboardMedecin />} />


        {/* Espace Patient */}
        <Route path="/login-patient" element={<LoginPatient />} />
        <Route path="/dashboard-patient" element={<DashboardPatient />} />
      </Routes>
    </Router>
  );
}

export default App;