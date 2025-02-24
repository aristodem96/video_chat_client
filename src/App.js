import React from "react";
import HomeChat from "./components/HomeChat";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NotFound from "./components/NotFound";
import './App.css';


const App = () => {
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeChat />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App;