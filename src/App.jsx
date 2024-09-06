import React from "react";
import PropertyAnalysis from "./components/PropertyAnalysis";
import propertyData from "./propertyData.json";

function App() {
  return (
    <div className="App">
      <PropertyAnalysis data={propertyData} />
    </div>
  );
}

export default App;
