import { useState } from 'react'
import { ethers } from 'ethers'
import axios from 'axios'
import { FaPlus, FaTrash } from 'react-icons/fa'
import './App.css'
import TransactionGraph from './components/TransactionGraph'
import Header from './components/Header'
import { useTheme } from './context/ThemeContext'

const ETHERSCAN_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY;

function App() {
  const { isDarkMode } = useTheme();
  const [wallets, setWallets] = useState(['', '']);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connectedTransactions, setConnectedTransactions] = useState([]);

  const addWallet = () => {
    setWallets([...wallets, '']);
  };

  const removeWallet = (index) => {
    if (wallets.length > 2) {
      const newWallets = wallets.filter((_, i) => i !== index);
      setWallets(newWallets);
    }
  };

  const fetchTransactions = async () => {
    const validWallets = wallets.filter(wallet => wallet.trim() !== '');
    
    if (validWallets.length < 2) {
      setError('Please enter at least 2 wallet addresses');
      return;
    }

    const invalidAddresses = validWallets.filter(wallet => !ethers.isAddress(wallet));
    if (invalidAddresses.length > 0) {
      setError('Please enter valid Ethereum addresses');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const allTransactions = await Promise.all(
        validWallets.map(async (wallet) => {
          const response = await axios.get(`https://api.etherscan.io/api`, {
            params: {
              module: 'account',
              action: 'txlist',
              address: wallet,
              startblock: 0,
              endblock: 99999999,
              page: 1,
              offset: 100,
              sort: 'desc',
              apikey: ETHERSCAN_API_KEY
            }
          });
          return response.data.status === '1' ? response.data.result : [];
        })
      );

      const flattenedTxs = [...new Set(allTransactions.flat())];
      const watchedAddresses = new Set(validWallets.map(w => w.toLowerCase()));
      const relevantTxs = flattenedTxs.filter(tx => 
        watchedAddresses.has(tx.from.toLowerCase()) || 
        (tx.to && watchedAddresses.has(tx.to.toLowerCase()))
      );

      const sortedTxs = relevantTxs.sort((a, b) => b.timeStamp - a.timeStamp);
      setTransactions(sortedTxs);

      const connected = sortedTxs.filter(tx =>
        watchedAddresses.has(tx.from.toLowerCase()) &&
        tx.to && watchedAddresses.has(tx.to.toLowerCase())
      );
      setConnectedTransactions(connected);
    } catch (err) {
      setError('Error fetching transactions: ' + err.message);
    }
    setLoading(false);
  };

  const getWalletLabel = (address) => {
    const index = wallets.findIndex(w => w.toLowerCase() === address.toLowerCase());
    return index !== -1 ? `Wallet ${index + 1}` : address.substring(0, 8) + '...';
  };

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : 'light'}`}>
      <Header />
      
      <main className="content">
        <section className="wallet-inputs-section">
          <div className="wallets-container">
            {wallets.map((wallet, index) => (
              <div key={index} className="wallet-input-group">
                <div className="wallet-header">
                  <label>Wallet {index + 1}</label>
                  {wallets.length > 2 && (
                    <button
                      onClick={() => removeWallet(index)}
                      className="remove-wallet"
                      aria-label="Remove wallet"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={wallet}
                  onChange={(e) => {
                    const newWallets = [...wallets];
                    newWallets[index] = e.target.value;
                    setWallets(newWallets);
                  }}
                  placeholder="Enter Ethereum address"
                />
              </div>
            ))}
            
            <button 
              onClick={addWallet}
              className="add-wallet-button"
            >
              <FaPlus /> Add Another Wallet
            </button>

            <button 
              onClick={fetchTransactions}
              disabled={loading}
              className="analyze-button"
            >
              {loading ? 'Analyzing...' : 'Analyze Transactions'}
            </button>
          </div>
        </section>

        {error && <div className="error-message">{error}</div>}

        {transactions.length > 0 && (
          <section className="results">
            <div className="graph-container">
              <h2>Transaction Flow Graph</h2>
              <TransactionGraph 
                wallets={wallets} 
                transactions={connectedTransactions}
              />
              <p className="graph-help">
                Click on nodes to view wallet details on Etherscan
                <br />
                Click on edges to view transaction details
              </p>
            </div>

            <div className="transactions-list">
              <h2>Direct Transfers ({connectedTransactions.length})</h2>
              <div className="transaction-cards">
                {connectedTransactions.map((tx) => (
                  <div key={tx.hash} className="transaction-card">
                    <div className="card-header">
                      <a 
                        href={`https://etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hash-link"
                      >
                        {tx.hash.substring(0, 10)}...
                      </a>
                      <span className="timestamp">
                        {new Date(tx.timeStamp * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="transfer-flow">
                      <div className="from">
                        <span className="label">From</span>
                        <span className="value">{getWalletLabel(tx.from)}</span>
                      </div>
                      <div className="arrow">→</div>
                      <div className="to">
                        <span className="label">To</span>
                        <span className="value">{getWalletLabel(tx.to)}</span>
                      </div>
                    </div>
                    <div className="amount">
                      <span className="label">Amount</span>
                      <span className="value">{Number(ethers.formatEther(tx.value)).toFixed(4)} ETH</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;