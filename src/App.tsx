import { BrowserRouter as Router } from "react-router-dom";
import PropertyAnalysis from "./components/PropertyAnalysis";
import propertyData from "./propertyData.json";
import { AuthProvider } from "./components/contexts/AuthContext";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <PropertyAnalysis data={propertyData} />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;