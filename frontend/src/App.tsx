import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Result from "./pages/Result";

export default function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <div className="Pages">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/result" element={<Result />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}
