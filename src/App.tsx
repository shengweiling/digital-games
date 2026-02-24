/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, RotateCw, RotateCcw, Info, Trophy, AlertCircle, RefreshCw, Coins, History, TrendingUp, TrendingDown, X, List, ChevronLeft, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Types & Constants ---

interface GameRecord {
  id: string;
  time: string;
  diceSum: number;
  resultNum: number;
  prize: string;
  value: number;
  isPenalty: boolean;
}

interface Cell {
  num: number;
  prize: string;
  value: number; // For calculation
  isPenalty?: boolean;
}

const BOARD_DATA: Cell[] = [
  { num: 14, prize: "奖350积分", value: 350 },
  { num: 15, prize: "奖50积分", value: 50 },
  { num: 12, prize: "奖350积分", value: 350 },
  { num: 11, prize: "奖50积分", value: 50 },
  { num: 10, prize: "奖100积分", value: 100 },
  { num: 19, prize: "奖50积分", value: 50 },
  { num: 20, prize: "奖600积分", value: 600 },
  { num: 7, prize: "奖50积分", value: 50 },
  { num: 22, prize: "奖400积分", value: 400 },
  { num: 30, prize: "奖50积分", value: 50 },
  { num: 24, prize: "奖350积分", value: 350 },
  { num: 29, prize: "奖50积分", value: 50 },
  { num: 26, prize: "奖400积分", value: 400 },
  { num: 27, prize: "罚40积分", value: -40, isPenalty: true },
  { num: 28, prize: "奖350积分", value: 350 },
  { num: 25, prize: "奖50积分", value: 50 },
  { num: 5, prize: "奖100积分", value: 100 },
  { num: 23, prize: "奖30积分", value: 30 },
  { num: 6, prize: "奖50积分", value: 50 },
  { num: 21, prize: "奖50积分", value: 50 },
  { num: 8, prize: "奖600积分", value: 600 },
  { num: 9, prize: "奖50积分", value: 50 },
  { num: 18, prize: "奖350积分", value: 350 },
  { num: 17, prize: "奖50积分", value: 50 },
  { num: 16, prize: "奖50积分", value: 50 },
  { num: 13, prize: "奖50积分", value: 50 },
];

const DICE_FACES = [
  { x: 0, y: 0 },    // 1
  { x: 0, y: 180 },  // 6
  { x: 0, y: -90 },  // 3
  { x: 0, y: 90 },   // 4
  { x: -90, y: 0 },  // 2
  { x: 90, y: 0 },   // 5
];

// --- Components ---

const DiceFace = ({ face }: { face: number }) => (
  <div className="grid grid-cols-3 grid-rows-3 gap-0.5 p-1 w-full h-full">
    {Array.from({ length: 9 }).map((_, dotIdx) => {
      const show = (
        (face === 1 && dotIdx === 4) ||
        (face === 2 && (dotIdx === 0 || dotIdx === 8)) ||
        (face === 3 && (dotIdx === 0 || dotIdx === 4 || dotIdx === 8)) ||
        (face === 4 && (dotIdx === 0 || dotIdx === 2 || dotIdx === 6 || dotIdx === 8)) ||
        (face === 5 && (dotIdx === 0 || dotIdx === 2 || dotIdx === 4 || dotIdx === 6 || dotIdx === 8)) ||
        (face === 6 && (dotIdx === 0 || dotIdx === 2 || dotIdx === 3 || dotIdx === 5 || dotIdx === 6 || dotIdx === 8))
      );
      return (
        <div key={dotIdx} className={`rounded-full ${show ? (face === 1 || face === 4 ? 'bg-red-600' : 'bg-black') : 'bg-transparent'} w-full h-full`} />
      );
    })}
  </div>
);

const Dice3D = ({ value, rolling }: { value: number; rolling: boolean; key?: React.Key }) => {
  return (
    <div className="dice-container w-10 h-10 md:w-14 md:h-14 perspective-1000">
      <AnimatePresence mode="wait">
        {rolling ? (
          <motion.div
            key="rolling"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              rotateX: [0, 360, 720, 1080],
              rotateY: [0, 360, 720, 1080],
              rotateZ: [0, 360, 720, 1080],
            }}
            exit={{ opacity: 0, scale: 1.2, filter: "blur(4px)" }}
            className="dice w-full h-full relative preserve-3d"
            transition={{
              rotateX: { duration: 1.5, repeat: Infinity, ease: "linear" },
              rotateY: { duration: 1.5, repeat: Infinity, ease: "linear" },
              rotateZ: { duration: 1.5, repeat: Infinity, ease: "linear" },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 }
            }}
          >
            {[1, 6, 3, 4, 2, 5].map((face, i) => {
              // Calculate translateZ based on container size (w-14 = 56px, so 28px)
              const tz = "28px";
              return (
                <div
                  key={i}
                  className="absolute inset-0 border border-black/10 rounded-lg flex items-center justify-center bg-white shadow-[inset_0_0_15px_rgba(0,0,0,0.1)] backface-hidden"
                  style={{
                    transform: i === 0 ? `translateZ(${tz})` :
                               i === 1 ? `rotateY(180deg) translateZ(${tz})` :
                               i === 2 ? `rotateY(90deg) translateZ(${tz})` :
                               i === 3 ? `rotateY(-90deg) translateZ(${tz})` :
                               i === 4 ? `rotateX(90deg) translateZ(${tz})` :
                               `rotateX(-90deg) translateZ(${tz})`
                  }}
                >
                  <DiceFace face={face} />
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ scale: 0.5, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="w-full h-full bg-white rounded-xl border-2 border-indigo-500/30 shadow-[0_8px_16px_rgba(0,0,0,0.2)] flex items-center justify-center overflow-hidden"
          >
            <div className="w-full h-full p-1.5 bg-gradient-to-br from-white to-indigo-50/50">
              <DiceFace face={value} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [diceValues, setDiceValues] = useState([1, 1, 1, 1, 1]);
  const [rolling, setRolling] = useState(false);
  const [direction, setDirection] = useState<'cw' | 'ccw'>('cw');
  const [gameState, setGameState] = useState<'idle' | 'rolling' | 'walking' | 'finished'>('idle');
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [stepsLeft, setStepsLeft] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [totalSum, setTotalSum] = useState(0);
  
  // Persistence State
  const [score, setScore] = useState(() => {
    const saved = localStorage.getItem('lucky_game_score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [history, setHistory] = useState<GameRecord[]>(() => {
    const saved = localStorage.getItem('lucky_game_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const walkInterval = useRef<NodeJS.Timeout | null>(null);

  // Daily Reward & Persistence Sync
  useEffect(() => {
    const today = new Date().toDateString();
    const lastRewardDate = localStorage.getItem('lucky_game_last_reward');
    
    if (lastRewardDate !== today) {
      setScore(prev => prev + 600);
      localStorage.setItem('lucky_game_last_reward', today);
      // Optional: show a notification or alert
      console.log("Daily reward 600 points added!");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lucky_game_score', score.toString());
  }, [score]);

  useEffect(() => {
    localStorage.setItem('lucky_game_history', JSON.stringify(history));
  }, [history]);

  const rollDice = () => {
    if (gameState !== 'idle') return;
    if (score < 30) {
      alert("积分不足，请充值（或刷新页面重置）！");
      return;
    }
    
    setScore(prev => prev - 30);
    setRolling(true);
    setGameState('rolling');
    setShowResult(false);
    
    setTimeout(() => {
      const newValues = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);
      const sum = newValues.reduce((a, b) => a + b, 0);
      setDiceValues(newValues);
      setTotalSum(sum);
      setRolling(false);
      
      // Find starting index
      const startIdx = BOARD_DATA.findIndex(c => c.num === sum);
      setCurrentIndex(startIdx);
      setGameState('walking');
      setStepsLeft(sum - 1); // We are already at the first step
    }, 1500);
  };

  useEffect(() => {
    if (gameState === 'walking' && currentIndex !== null) {
      if (stepsLeft > 0) {
        walkInterval.current = setTimeout(() => {
          setCurrentIndex(prev => {
            if (prev === null) return null;
            if (direction === 'cw') {
              return (prev + 1) % BOARD_DATA.length;
            } else {
              return (prev - 1 + BOARD_DATA.length) % BOARD_DATA.length;
            }
          });
          setStepsLeft(prev => prev - 1);
        }, 300);
      } else {
        setGameState('finished');
        setShowResult(true);
        const finalCell = BOARD_DATA[currentIndex];
        
        // Update score and history
        setScore(prev => prev + finalCell.value);
        const newRecord: GameRecord = {
          id: Math.random().toString(36).substr(2, 9),
          time: new Date().toLocaleTimeString(),
          diceSum: totalSum,
          resultNum: finalCell.num,
          prize: finalCell.prize,
          value: finalCell.value,
          isPenalty: !!finalCell.isPenalty
        };
        setHistory(prev => [newRecord, ...prev]);

        if (finalCell.value > 100) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    }
    return () => {
      if (walkInterval.current) clearTimeout(walkInterval.current);
    };
  }, [gameState, currentIndex, stepsLeft, direction]);

  const resetGame = () => {
    setGameState('idle');
    setCurrentIndex(null);
    setStepsLeft(0);
    setShowResult(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Header */}
      <header className="py-8 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-2"
        >
          有奖数字游戏
        </motion.h1>
        <p className="text-indigo-300/80 text-sm md:text-base font-medium tracking-widest uppercase">
          30积分一次 • 每日赠送600积分 • 试试你的运气
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Controls & Stats */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <RotateCw className="w-5 h-5 text-indigo-400" />
              游戏设置
            </h2>
            
            <div className="space-y-4">
              <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
                <button
                  onClick={() => setDirection('cw')}
                  disabled={gameState !== 'idle'}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${direction === 'cw' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-white/40 hover:text-white/60'}`}
                >
                  <RotateCw className="w-4 h-4" />
                  顺时针
                </button>
                <button
                  onClick={() => setDirection('ccw')}
                  disabled={gameState !== 'idle'}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${direction === 'ccw' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-white/40 hover:text-white/60'}`}
                >
                  <RotateCcw className="w-4 h-4" />
                  逆时针
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-400" />
              游戏规则
            </h2>
            <ul className="space-y-3 text-sm text-indigo-200/70 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-indigo-400 font-bold">01</span>
                五个骰子一起丢，把点数加起。
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-400 font-bold">02</span>
                从点数对应的格子开始数。
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-400 font-bold">03</span>
                顺着选定方向从起点开始数完点数对应的步数。
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-400 font-bold">04</span>
                最后停留的格子即为中奖结果。
              </li>
            </ul>
          </section>

          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                数据统计
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">现有积分</div>
                  <div className="text-2xl font-black text-yellow-400">{score}</div>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">游戏次数</div>
                  <div className="text-2xl font-black text-white">{history.length}</div>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">中奖次数</div>
                  <div className="text-2xl font-black text-emerald-400">
                    {history.filter(h => !h.isPenalty && h.value > 0).length}
                  </div>
                </div>
                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-1">罚分次数</div>
                  <div className="text-2xl font-black text-red-400">
                    {history.filter(h => h.isPenalty).length}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setCurrentPage(1);
                  setShowHistory(true);
                }}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <List className="w-4 h-4" />
                查看详情记录
              </button>
            </section>
          </div>

        {/* Right: The Board */}
        <div className="lg:col-span-8">
          <div className="relative aspect-square md:aspect-auto md:h-[700px] w-full bg-white/5 rounded-[40px] border border-white/10 p-4 md:p-8 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            
            <div className="grid grid-cols-9 grid-rows-6 gap-1 md:gap-2 w-full h-full max-w-[800px] max-h-[800px]">
              {BOARD_DATA.slice(0, 9).map((cell, i) => (
                <BoardCell key={i} cell={cell} active={currentIndex === i} />
              ))}

              {/* Right Column: 9-12 */}
              <div className="col-start-9 row-start-2 row-span-4 grid grid-rows-4 gap-1 md:gap-2">
                {BOARD_DATA.slice(9, 13).map((cell, i) => (
                  <BoardCell key={i + 9} cell={cell} active={currentIndex === i + 9} />
                ))}
              </div>

              {/* Bottom Row: 13-21 (Reversed for visual flow) */}
              <div className="col-start-1 col-span-9 row-start-6 grid grid-cols-9 gap-1 md:gap-2">
                {BOARD_DATA.slice(13, 22).reverse().map((cell, i) => {
                  const actualIdx = 21 - i;
                  return <BoardCell key={actualIdx} cell={cell} active={currentIndex === actualIdx} />;
                })}
              </div>

              {/* Left Column: 22-25 (Reversed for visual flow) */}
              <div className="col-start-1 row-start-2 row-span-4 grid grid-rows-4 gap-1 md:gap-2">
                {BOARD_DATA.slice(22, 26).reverse().map((cell, i) => {
                  const actualIdx = 25 - i;
                  return <BoardCell key={actualIdx} cell={cell} active={currentIndex === actualIdx} />;
                })}
              </div>

              {/* Center Area */}
              <div className="col-start-2 col-span-7 row-start-2 row-span-4 flex flex-col items-center justify-center text-center p-4 relative">
                <div className="text-indigo-400/5 font-black text-8xl md:text-12xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none">
                  LUCKY
                </div>
                
                <div className="relative z-10 space-y-6 w-full max-w-md">
                  {/* Dice Display */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex justify-center gap-2 md:gap-4">
                      {diceValues.map((v, i) => (
                        <Dice3D key={i} value={v} rolling={rolling} />
                      ))}
                    </div>
                    {gameState !== 'idle' && !rolling && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl font-black text-yellow-400"
                      >
                        {totalSum} 步
                      </motion.div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={gameState === 'finished' ? resetGame : rollDice}
                      disabled={gameState === 'rolling' || gameState === 'walking'}
                      className={`px-8 md:px-12 py-3 md:py-4 rounded-2xl font-black text-lg md:text-xl uppercase tracking-wider transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-2xl ${
                        gameState === 'finished' 
                          ? 'bg-white text-black hover:bg-white/90' 
                          : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:shadow-orange-500/40 disabled:opacity-50'
                      }`}
                    >
                      {gameState === 'finished' ? (
                        <>
                          <RefreshCw className="w-8 h-8" />
                          再来一局
                        </>
                      ) : gameState === 'walking' ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                          >
                            <RotateCw className="w-8 h-8" />
                          </motion.div>
                          正在行走...
                        </>
                      ) : (
                        <>
                          <Dices className="w-8 h-8" />
                          开始投掷
                        </>
                      )}
                    </button>
                  </div>

                  {gameState === 'walking' && (
                    <div className="text-indigo-300/60 font-medium tracking-widest uppercase text-sm">
                      剩余 {stepsLeft + 1} 步
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && currentIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1e293b] border border-white/10 rounded-[40px] p-8 max-w-md w-full text-center shadow-2xl"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${BOARD_DATA[currentIndex].isPenalty ? 'bg-red-500/20 text-red-500' : 'bg-yellow-400/20 text-yellow-400'}`}>
                {BOARD_DATA[currentIndex].isPenalty ? <AlertCircle className="w-10 h-10" /> : <Trophy className="w-10 h-10" />}
              </div>
              
              <h3 className="text-3xl font-black mb-2">
                {BOARD_DATA[currentIndex].isPenalty ? '运气不佳' : '恭喜中奖'}
              </h3>
              <p className="text-indigo-300/60 mb-8">
                骰子总点数为 <span className="text-white font-bold">{totalSum}</span>，最终停在 <span className="text-white font-bold">{BOARD_DATA[currentIndex].num}</span> 号位
              </p>

              <div className={`text-5xl font-black mb-8 ${BOARD_DATA[currentIndex].isPenalty ? 'text-red-500' : 'text-yellow-400'}`}>
                {BOARD_DATA[currentIndex].prize}
              </div>

              <button
                onClick={resetGame}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-white/90 transition-colors"
              >
                确定
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1e293b] border border-white/10 rounded-[40px] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-bottom border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <History className="w-6 h-6 text-indigo-400" />
                  游戏记录详情
                </h3>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {history.length === 0 ? (
                  <div className="text-center py-20 text-white/20">
                    <History className="w-16 h-16 mx-auto mb-4 opacity-10" />
                    <p>暂无游戏记录</p>
                  </div>
                ) : (
                  <>
                    {history.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((record) => (
                      <div 
                        key={record.id}
                        className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.isPenalty ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {record.isPenalty ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="font-bold">{record.prize}</div>
                            <div className="text-xs text-white/40">{record.time} • 骰子点数: {record.diceSum}</div>
                          </div>
                        </div>
                        <div className={`text-lg font-black ${record.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {record.value >= 0 ? `+${record.value}` : record.value}
                        </div>
                      </div>
                    ))}
                    
                    {history.length > pageSize && (
                      <div className="flex items-center justify-center gap-4 pt-6">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-bold">
                          第 {currentPage} / {Math.ceil(history.length / pageSize)} 页
                        </span>
                        <button
                          disabled={currentPage === Math.ceil(history.length / pageSize)}
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(history.length / pageSize), p + 1))}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="p-6 bg-white/5 border-top border-white/10 text-center">
                <p className="text-sm text-white/40 italic">仅显示当前会话记录</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </div>
  );
}

function BoardCell({ cell, active }: { cell: Cell; active: boolean; key?: React.Key }) {
  return (
    <div 
      className={`relative rounded-xl md:rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center p-1 md:p-2 overflow-hidden ${
        active 
          ? 'bg-indigo-600 border-white shadow-[0_0_20px_rgba(79,70,229,0.5)] scale-105 z-10' 
          : 'bg-white/5 border-white/5 hover:bg-white/10'
      }`}
    >
      <div className={`text-xs md:text-sm font-black mb-0.5 md:mb-1 ${active ? 'text-white' : 'text-white/40'}`}>
        {cell.num}
      </div>
      <div className={`text-[10px] md:text-xs font-bold whitespace-nowrap ${
        active 
          ? 'text-white' 
          : cell.isPenalty ? 'text-red-400' : cell.value > 100 ? 'text-yellow-400' : 'text-indigo-300/60'
      }`}>
        {cell.prize}
      </div>
      
      {active && (
        <motion.div
          layoutId="active-glow"
          className="absolute inset-0 bg-white/20 animate-pulse"
        />
      )}
    </div>
  );
}
