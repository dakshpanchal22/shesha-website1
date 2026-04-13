import { useState, useEffect } from 'react';
import LoadingScreen from './components/LoadingScreen';
import Hero from './components/Hero';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Show the 3D card loader for 3.5 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="App">
      {loading ? <LoadingScreen /> : <Hero />}
    </div>
  );
}

export default App;