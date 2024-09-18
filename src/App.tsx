import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PropertyAnalysis from "./components/PropertyAnalysis";
import PropertyList from "./components/PropertyList";
import Navbar from './components/Navbar';
import propertyData from "./propertyData.json";
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
            <Route path="/analyze" element={<PropertyAnalysis data={propertyData} />} />
            <Route path="/property-analysis/:id" element={<PropertyAnalysis data={null} />} />
            <Route path="/property-analysis/:id/:taskId" element={<PropertyAnalysis data={null} />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;