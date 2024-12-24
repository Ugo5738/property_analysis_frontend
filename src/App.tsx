import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Navbar from './components/Navbar';
import PhoneNumberInput from "./components/PhoneNumberInput";
import PromptUpdater from "./components/Prompt";
import PropertyAnalysis from "./components/PropertyAnalysis";
import PropertyList from "./components/PropertyList";
import { AuthProvider } from "./components/contexts/AuthContext";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<PropertyList />} />
            <Route path="/enter-phone" element={<PhoneNumberInput />} />
            <Route path="/prompt-update" element={<PromptUpdater />} />
            <Route path="/properties" element={<PropertyList />} />
            <Route path="/analyze" element={<PropertyAnalysis />} />
            <Route path="/property-analysis/:id" element={<PropertyAnalysis />} />
            <Route path="/property-analysis/:id/:taskId" element={<PropertyAnalysis />} />
            {/* Shared read-only route */}
            <Route path="/property-analysis/shared/:id/:taskId/:shareToken" element={<PropertyAnalysis />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;