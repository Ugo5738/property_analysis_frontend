import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PropertyAnalysis from "./components/PropertyAnalysis";
import PropertyList from "./components/PropertyList";
import Navbar from './components/Navbar';
import { AuthProvider } from "./components/contexts/AuthContext";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<PropertyList />} />
            <Route path="/properties" element={<PropertyList />} />
            <Route path="/analyze" element={<PropertyAnalysis />} />
            <Route path="/property-analysis/:id" element={<PropertyAnalysis />} />
            <Route path="/property-analysis/:id/:taskId" element={<PropertyAnalysis />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;