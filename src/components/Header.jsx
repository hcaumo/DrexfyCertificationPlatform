import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon, FaGithub } from 'react-icons/fa';

const Header = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-section">
          <h1>Ethereum Flow</h1>
          <p className="subtitle">Track and visualize transactions between wallets</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </div>
      
      <div className="features">
        <div className="feature">
          <span className="feature-icon">🔍</span>
          <span className="feature-text">Track Multiple Wallets</span>
        </div>
        <div className="feature">
          <span className="feature-icon">📊</span>
          <span className="feature-text">Interactive Visualization</span>
        </div>
        <div className="feature">
          <span className="feature-icon">⚡</span>
          <span className="feature-text">Real-time Data</span>
        </div>
      </div>
    </header>
  );
};

export default Header;