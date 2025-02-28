import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useCallback, useMemo } from 'react';
import { ethers } from 'ethers';

const TransactionGraph = ({ wallets, transactions }) => {
  const nodes = useMemo(() => 
    wallets
      .filter(wallet => wallet.trim() !== '')
      .map((wallet, index) => ({
        id: wallet.toLowerCase(),
        data: { 
          label: `Wallet ${index + 1}`,
          address: wallet
        },
        position: { 
          x: 250 * (index - (wallets.length - 1) / 2), 
          y: 100 
        },
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid #646cff',
          borderRadius: '8px',
          padding: '10px',
          width: 180,
        }
      })), 
    [wallets]
  );

  const edges = useMemo(() => {
    const edgeMap = new Map();
    
    transactions.forEach(tx => {
      const fromWallet = wallets.find(w => w.toLowerCase() === tx.from.toLowerCase());
      const toWallet = wallets.find(w => w.toLowerCase() === tx.to?.toLowerCase());
      
      if (fromWallet && toWallet) {
        const edgeId = `${tx.from.toLowerCase()}-${tx.to.toLowerCase()}`;
        const existingEdge = edgeMap.get(edgeId);
        
        if (existingEdge) {
          const currentTotal = BigInt(existingEdge.data.totalValue);
          const newValue = BigInt(tx.value);
          existingEdge.data.transactions.push(tx);
          existingEdge.data.totalValue = (currentTotal + newValue).toString();
        } else {
          edgeMap.set(edgeId, {
            id: edgeId,
            source: tx.from.toLowerCase(),
            target: tx.to.toLowerCase(),
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#646cff' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#646cff',
            },
            data: {
              transactions: [tx],
              totalValue: tx.value
            },
            label: `${Number(ethers.formatEther(tx.value)).toFixed(4)} ETH`,
          });
        }
      }
    });

    return Array.from(edgeMap.values()).map(edge => ({
      ...edge,
      label: `${Number(ethers.formatEther(edge.data.totalValue)).toFixed(4)} ETH`,
    }));
  }, [transactions, wallets]);

  const onNodeClick = useCallback((_, node) => {
    window.open(`https://etherscan.io/address/${node.data.address}`, '_blank');
  }, []);

  const onEdgeClick = useCallback((_, edge) => {
    const tx = edge.data.transactions[0];
    window.open(`https://etherscan.io/tx/${tx.hash}`, '_blank');
  }, []);

  return (
    <div style={{ height: 400, background: '#0a0a0a', borderRadius: '12px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        fitView
      >
        <Background color="#333" variant="dots" />
        <Controls />
        <MiniMap style={{ background: '#1a1a1a' }} nodeColor="#646cff" />
      </ReactFlow>
    </div>
  );
};

export default TransactionGraph;