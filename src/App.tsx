import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider } from "./components/contexts/AuthContext";
import Navbar from './components/Navbar';
import PhoneNumberInput from "./components/PhoneNumberInput";
import PromptUpdater from "./components/Prompt";
import PropertyAnalysis from "./components/PropertyAnalysis";
import PropertyComparisonTable from "./components/PropertyComparisonTable";
import PropertyList from "./components/PropertyList";

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
            <Route path="/compare" element={<PropertyComparisonTable />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;