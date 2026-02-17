
import React, { useState } from 'react';
import { GameState, Brawler } from './types';
import Lobby from './components/Lobby';
import Game from './components/Game';
import { generateMatchCommentary } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.LOBBY);
  const [selectedBrawler, setSelectedBrawler] = useState<Brawler | null>(null);
  const [lastWinner, setLastWinner] = useState<'blue' | 'red' | null>(null);
  const [commentary, setCommentary] = useState<string>('');

  const handleStartGame = (brawler: Brawler) => {
    setSelectedBrawler(brawler);
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = async (winner: 'blue' | 'red') => {
    setLastWinner(winner);
    setGameState(GameState.GAMEOVER);
    const comm = await generateMatchCommentary(winner, { 
      brawler: selectedBrawler?.name, 
      map: 'Crystal Cavern' 
    });
    setCommentary(comm);
  };

  return (
    <div className="w-full h-full font-sans">
      {gameState === GameState.LOBBY && (
        <Lobby onStart={handleStartGame} onSetState={setGameState} />
      )}

      {gameState === GameState.PLAYING && selectedBrawler && (
        <Game playerBrawler={selectedBrawler} onGameOver={handleGameOver} />
      )}

      {gameState === GameState.GAMEOVER && (
        <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-8 text-white z-50">
           <div className={`text-6xl font-black italic mb-4 tracking-tighter uppercase ${lastWinner === 'blue' ? 'text-blue-400' : 'text-red-500'}`}>
              {lastWinner === 'blue' ? 'WINNER!' : 'DEFEAT'}
           </div>
           
           <div className="bg-slate-800/60 p-8 rounded-3xl border border-white/10 max-w-xl text-center mb-12 backdrop-blur-2xl shadow-2xl">
              <p className="text-xl font-bold leading-relaxed italic text-blue-200">"{commentary || "What a match!"}"</p>
           </div>

           <div className="flex gap-4">
              <button 
                onClick={() => setGameState(GameState.LOBBY)}
                className="px-10 py-4 bg-blue-600 rounded-xl font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                RETURN TO LOBBY
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
