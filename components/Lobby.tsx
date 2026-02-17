
import React, { useState } from 'react';
import { Brawler, GameState } from '../types';
import { DEFAULT_BRAWLERS } from '../constants';
import { generateBrawler } from '../services/geminiService';

interface LobbyProps {
  onStart: (brawler: Brawler) => void;
  onSetState: (state: GameState) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onStart, onSetState }) => {
  const [brawlers, setBrawlers] = useState<Brawler[]>(DEFAULT_BRAWLERS);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const newBrawler = await generateBrawler();
    if (newBrawler) {
      setBrawlers(prev => [newBrawler, ...prev]);
      setSelectedIdx(0);
    }
    setIsGenerating(false);
  };

  const handleBrawl = () => {
    setMatching(true);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setMatchCount(count);
      if (count >= 6) {
        clearInterval(interval);
        onStart(brawlers[selectedIdx]);
      }
    }, 500);
  };

  const selected = brawlers[selectedIdx];

  if (matching) {
    return (
      <div className="fixed inset-0 bg-blue-900 flex flex-col items-center justify-center text-white z-[100]">
        <div className="text-4xl font-black italic mb-8 animate-bounce">MATCHMAKING...</div>
        <div className="grid grid-cols-3 gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`w-20 h-20 rounded-2xl border-4 transition-all duration-300 ${i < matchCount ? 'border-yellow-400 bg-yellow-400/20 scale-110' : 'border-white/10 bg-white/5'}`}>
              {i < matchCount && <div className="w-full h-full flex items-center justify-center font-bold text-xs">FOUND</div>}
            </div>
          ))}
        </div>
        <p className="text-xl font-bold opacity-70">Searching for Brawlers {matchCount}/6</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-4 text-white overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] opacity-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600 rounded-full blur-[120px] opacity-10"></div>

      <h1 className="text-4xl font-black italic mb-6 tracking-tighter drop-shadow-lg uppercase">
        Gemini <span className="text-blue-400">Brawlers</span>
      </h1>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl items-stretch">
        <div className="flex-1 space-y-2 overflow-y-auto max-h-[40vh] md:max-h-[60vh] pr-2 custom-scrollbar">
          <button onClick={handleGenerate} disabled={isGenerating} className={`w-full p-4 rounded-xl border-2 border-dashed border-slate-600 flex items-center gap-3 transition-all hover:border-blue-400 hover:bg-slate-800 ${isGenerating ? 'opacity-50' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center"><i className="fas fa-plus"></i></div>
            <div className="text-left"><p className="font-bold text-sm">SUMMON BRAWLER</p></div>
          </button>
          {brawlers.map((b, idx) => (
            <button key={b.id} onClick={() => setSelectedIdx(idx)} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${selectedIdx === idx ? 'bg-blue-600 scale-[1.02] shadow-lg ring-2 ring-white/20' : 'bg-slate-800 hover:bg-slate-700'}`}>
              <div className="w-10 h-10 rounded-full border-2 border-white/20" style={{ backgroundColor: b.color }}></div>
              <div className="text-left"><p className="font-bold text-sm">{b.name}</p><p className="text-[10px] opacity-60 uppercase">{b.type}</p></div>
            </button>
          ))}
        </div>

        <div className="flex-[1.5] bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 flex flex-col items-center relative">
          <div className="w-32 h-32 rounded-full mb-4 border-4 border-white/10 shadow-xl" style={{ backgroundColor: selected.color }}></div>
          <h2 className="text-3xl font-black mb-1">{selected.name}</h2>
          <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black mb-4 uppercase tracking-widest border border-blue-500/20">{selected.type}</span>
          <p className="text-center text-slate-400 mb-6 text-sm italic max-w-xs">"{selected.description}"</p>

          <div className="grid grid-cols-2 gap-3 w-full mb-6">
            <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex items-center gap-3">
              <i className="fas fa-heart text-red-500"></i>
              <div><p className="text-[10px] text-slate-500 font-bold">HP</p><p className="font-bold text-sm">{selected.hp}</p></div>
            </div>
            <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex items-center gap-3">
              <i className="fas fa-fist-raised text-yellow-500"></i>
              <div><p className="text-[10px] text-slate-500 font-bold">ATK</p><p className="font-bold text-sm">{selected.damage}</p></div>
            </div>
          </div>

          <button onClick={handleBrawl} className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-black text-xl rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all shadow-yellow-500/20">
            PLAY BRAWL
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
