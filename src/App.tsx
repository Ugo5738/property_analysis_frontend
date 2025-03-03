import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider } from "./components/contexts/AuthContext";
import Navbar from './components/Navbar';
import PhoneNumberInput from "./components/PhoneNumberInput";
import PromptUpdater from "./components/Prompt";
import PropertyAnalysisWrapper from "./components/PropertyAnalysisWrapper";
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
            <Route path="/analyze" element={<PropertyAnalysisWrapper />} />
            {/* Use the wrapper for both routes */}
            <Route path="/property-analysis/:id" element={<PropertyAnalysisWrapper />} />
            <Route path="/property-analysis/:id/:taskId" element={<PropertyAnalysisWrapper />} />
            {/* Shared read-only route */}
            <Route path="/property-analysis/shared/:id/:taskId/:shareToken" element={<PropertyAnalysisWrapper />} />
            <Route path="/compare" element={<PropertyComparisonTable />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;