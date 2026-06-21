"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_GAS_URL;
        if (!url) {
          console.error("GASのURLが設定されていません");
          setLoading(false);
          return;
        }
        const res = await fetch(url);
        const json = await res.json();
        
        if (json && json.catalog) {
          const allItems: any[] = [];
          Object.keys(json.catalog).forEach((categoryName) => {
            const items = json.catalog[categoryName];
            if (Array.isArray(items)) {
              items.forEach((item) => {
                allItems.push({ ...item, category: categoryName });
              });
            }
          });
          setData(allItems);
          
          if (Object.keys(json.catalog).length > 0) {
            setActiveCategory(Object.keys(json.catalog)[0]);
          }
        } else {
          setData([]);
        }
      } catch (error) {
        console.error("データの取得に失敗しました:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setSearchQuery("");
  }, [activeCategory]);

  const togglePin = (id: string) => {
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePdfExport = () => {
    if (pinnedIds.length === 0) {
      alert("提案書に出力する機材を1つ以上ピン付け（選択）してください。");
      return;
    }
    window.print();
  };

  // ✨ 自社製品（PAL）判定ロジック（株式会社PALの完全一致のみ）
  const checkIsPalProduct = (maker: string) => {
    if (!maker) return false;
    return maker.trim() === "株式会社PAL";
  };

  const categories = Array.from(new Set(data.map((item) => item.category)));
  const pinnedItems = data.filter((item) => pinnedIds.includes(item.id));
  const pinnedCategories = Array.from(new Set(pinnedItems.map((item) => item.category)));

  // 🔍 フィルタリング処理
  const filteredData = data.filter((item) => {
    if (item.category !== activeCategory) return false;
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.usage && item.usage.toLowerCase().includes(query)) ||
      (item.effect && item.effect.toLowerCase().includes(query)) ||
      (item.type && item.type.toLowerCase().includes(query)) ||
      (item.maker && item.maker.toLowerCase().includes(query))
    );
  });

  // 🏆 株式会社PALの製品を強制的に「最上部」へ移動させるソート処理
  const sortedFilteredData = [...filteredData].sort((a, b) => {
    const isAPal = checkIsPalProduct(a.maker);
    const isBPal = checkIsPalProduct(b.maker);
    if (isAPal && !isBPal) return -1;
    if (!isAPal && isBPal) return 1;
    return 0;
  });

  const isAllPinned = sortedFilteredData.length > 0 && sortedFilteredData.every((item) => pinnedIds.includes(item.id));

  const toggleAllCurrent = () => {
    if (isAllPinned) {
      setPinnedIds((prev) => prev.filter((id) => !sortedFilteredData.find((item) => item.id === id)));
    } else {
      const newIds = sortedFilteredData.map((item) => item.id).filter((id) => !pinnedIds.includes(id));
      setPinnedIds((prev) => [...prev, ...newIds]);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 print:bg-white print:text-slate-950">
      
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 18mm 15mm; }
          body { -webkit-print-color-adjust: exact; color-adjust: exact; background: white !important; color: #0f172a !important; }
          .no-print { display: none !important; }
          .page-break { page-break-inside: avoid; page-break-after: auto; }
          .proposal-card { border: 1px solid #cbd5e1 !important; border-left: 4px solid #1e3a8a !important; page-break-inside: avoid; }
        }
        /* サイバー風スキャンアニメーション */
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>

      {/* =========================================================
          💻 1. Web画面用UI
          ========================================================= */}
      <div className="no-print sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 shadow-md px-6 py-4 w-full">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <img src="/pal-logo.png" alt="PAL Logo" className="h-12 w-auto object-contain bg-white/10 rounded p-1" onError={(e) => e.currentTarget.style.display = 'none'} />
            <div>
              <p className="text-xs font-bold text-slate-400">株式会社PAL | 物流ソリューションディビジョン</p>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">マテハン機器選定・自動化提案システム</h1>
            </div>
          </div>
          
          <button
            onClick={handlePdfExport}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all whitespace-nowrap ${
              pinnedIds.length > 0 
                ? "bg-blue-600 text-white hover:bg-blue-500 active:scale-95" 
                : "bg-slate-700 text-slate-400 cursor-not-allowed"
            }`}
          >
            📌 提案書PDFを生成 ({pinnedIds.length}件)
          </button>
        </div>
      </div>

      <div className="no-print p-6 max-w-[1400px] mx-auto">
        {loading ? (
          /* ✨ 美しくワクワクするサイバー風ローディング画面 */
          <div className="flex flex-col items-center justify-center py-32 px-4">
            <div className="relative flex justify-center items-center w-36 h-36 mb-8">
              {/* 回転する未来的なリング群 */}
              <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 opacity-80 animate-[spin_3s_linear_infinite]"></div>
              <div className="absolute inset-2 rounded-full border-r-2 border-cyan-400 opacity-60 animate-[spin_2s_linear_infinite_reverse]"></div>
              <div className="absolute inset-4 rounded-full border-b-2 border-indigo-500 opacity-70 animate-[spin_4s_linear_infinite]"></div>
              
              {/* 中央のPALロゴ */}
              <div className="bg-slate-900 rounded-full w-20 h-20 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                <img src="/pal-logo.png" alt="PAL Logo" className="h-8 w-auto object-contain animate-pulse" onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>
            </div>
            
            {/* テキストとスキャンバー */}
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-[0.3em] animate-pulse">
                SYSTEM INITIALIZING
              </h3>
              <p className="text-sm text-slate-400 font-medium tracking-widest">
                株式会社PAL 最新マテハンマスターを同期中...
              </p>
              
              <div className="w-64 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden mt-6 relative shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 animate-[fadeIn_0.5s_ease-out]">
            
            <div className="w-full lg:w-64 shrink-0 space-y-1">
              <p className="text-xs font-bold text-slate-400 px-3 mb-2 uppercase tracking-wider">シート仕分け（種別）</p>
              {categories.map((cat) => {
                const count = data.filter((item) => item.category === cat).length;
                const pinnedCount = data.filter((item) => item.category === cat && pinnedIds.includes(item.id)).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex justify-between items-center ${
                      activeCategory === cat
                        ? "bg-blue-600 text-white shadow-md font-bold"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <span className="flex items-center gap-1.5 text-xs">
                      {pinnedCount > 0 && <span className="text-yellow-400">📌{pinnedCount}</span>}
                      <span className="opacity-60">({count})</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 space-y-4">
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                  <input 
                    type="text" 
                    placeholder="キーワードで絞り込み (例: 生産性、動線、省人化...)" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-2 mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{activeCategory}</span>
                  <span className="text-xs font-normal text-slate-400">の登録機材一覧</span>
                </h2>
                
                <label className="flex items-center gap-2 cursor-pointer group bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700">
                  <input 
                    type="checkbox" 
                    checked={isAllPinned}
                    onChange={toggleAllCurrent}
                    className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-900 cursor-pointer"
                  />
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white">
                    表示中の機材をすべてピン留め
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {sortedFilteredData.length > 0 ? (
                  sortedFilteredData.map((item) => {
                    const isPinned = pinnedIds.includes(item.id);
                    const isPal = checkIsPalProduct(item.maker);

                    return (
                      <div
                        key={item.id}
                        className={`p-5 rounded-xl border transition-all flex flex-col justify-between h-full ${
                          isPinned
                            ? "bg-blue-950/40 border-blue-500 shadow-md relative"
                            : "bg-slate-800 border-slate-700/60"
                        } ${isPal && !isPinned ? "border-blue-500/30 bg-blue-900/10" : ""}`}
                      >
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {isPal ? (
                                  <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold shadow-[0_0_8px_rgba(37,99,235,0.6)] border border-blue-400">✨ PAL自社製品</span>
                                ) : (
                                  <span className="text-xs text-slate-400 font-medium">{item.maker}</span>
                                )}
                                <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{item.type}</span>
                              </div>
                              <h3 className="text-base font-bold text-white leading-tight">{item.name}</h3>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-sm font-bold text-blue-400 block">{item.price || "オープン"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
                          <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/50">
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">■ 目的・用途</span>
                            <p className="text-xs text-slate-300 line-clamp-4 whitespace-pre-line">
                              {String(item.usage || "─").replace(/➔/g, '\n➔')}
                            </p>
                          </div>
                          <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/50">
                            <span className="text-[10px] font-bold text-emerald-600 block mb-1">■ 数値効果・特徴</span>
                            <p className="text-xs text-slate-300 line-clamp-4 whitespace-pre-line">
                              {String(item.effect || "─").replace(/➔/g, '\n➔')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-700/50">
                          <div className="w-1/2 pr-2">
                            {item.link ? (
                              <a 
                                href={item.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 truncate"
                                title={item.link}
                              >
                                🔗 公式サイト等へ
                              </a>
                            ) : (
                              <span className="text-xs text-slate-600">🔗 リンクなし</span>
                            )}
                          </div>
                          <button
                            onClick={() => togglePin(item.id)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                              isPinned 
                                ? "bg-blue-600 text-white hover:bg-blue-700" 
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            }`}
                          >
                            {isPinned ? "📌 提案書から外す" : "提案書にピン留め"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-10 text-center text-slate-500">
                    検索キーワードに一致する機材が見つかりません。
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* =========================================================
          📄 2. PDF出力用UI（提案書）
          ========================================================= */}
      <div className="hidden print:block text-slate-900 bg-white">
        {pinnedItems.length > 0 && (
          <div>
            <div className="border-b-4 border-blue-900 pb-6 mb-8 flex justify-between items-end">
              <div>
                <div className="text-xs font-black tracking-widest text-blue-800 mb-1">LOGISTICS AUTOMATION PROPOSAL</div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">物流自動化・設備導入提案書</h1>
                <p className="text-xs text-slate-500 mt-1.5">
                  御社の物流課題に基づき、マスターデータより選定した改善機材の構成案です。
                </p>
              </div>
              <div className="text-right flex flex-col items-end">
                <img src="/pal-logo.png" alt="PAL Logo" className="h-10 w-auto mb-1" />
                <div className="text-[10px] text-slate-500 font-medium">Logistics Solution Division</div>
              </div>
            </div>

            <div className="space-y-10">
              {pinnedCategories.map((catName) => {
                const sortedPinnedInCategory = pinnedItems
                  .filter((item) => item.category === catName)
                  .sort((a, b) => {
                    const isAPal = checkIsPalProduct(a.maker);
                    const isBPal = checkIsPalProduct(b.maker);
                    if (isAPal && !isBPal) return -1;
                    if (!isAPal && isBPal) return 1;
                    return 0;
                  });

                return (
                  <div key={catName} className="space-y-4">
                    <div className="bg-slate-900 text-white px-4 py-2 rounded font-black text-sm tracking-wide flex justify-between items-center">
                      <span>【種別】 {catName}</span>
                      <span className="text-xs text-slate-400 font-normal">
                        選定数: {sortedPinnedInCategory.length}件
                      </span>
                    </div>

                    <div className="space-y-6">
                      {sortedPinnedInCategory.map((item) => {
                        const effectText = item.effect || "";
                        const hasWarning = effectText.includes("弱点") || effectText.includes("注意") || effectText.includes("デメリット");
                        const isPal = checkIsPalProduct(item.maker);

                        return (
                          <div key={`print-${item.id}`} className="proposal-card border border-slate-300 border-l-4 border-l-blue-800 bg-white rounded-r-xl p-5 shadow-sm space-y-4 page-break">
                            
                            <div className="flex justify-between items-start border-b border-slate-200 pb-2.5">
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5 flex items-center gap-1.5">
                                  {isPal && <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[8px] leading-none">✨ PAL製品</span>}
                                  {item.maker}
                                </span>
                                <h3 className="text-base font-black text-slate-900">{item.name}</h3>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">参考価格 / 種別</span>
                                <span className="text-sm font-extrabold text-blue-900">{item.price || "オープン価格"}</span>
                                <span className="text-[11px] font-mono font-bold text-slate-500 block">({item.type || "標準"})</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 md:col-span-2">
                                <span className="font-bold text-slate-800 block mb-1">■ 目的・導入想定環境</span>
                                <p className="text-slate-700 whitespace-pre-line text-[11px]">
                                  {String(item.usage || "情報なし").replace(/➔/g, '\n➔')}
                                </p>
                                {item.link && (
                                  <p className="mt-2 text-[10px] text-blue-600">
                                    [参考URL]: {item.link}
                                  </p>
                                )}
                              </div>

                              <div className="border border-emerald-200 bg-emerald-50/20 p-3 rounded-lg">
                                <span className="font-bold text-emerald-800 block mb-1">🟢 数値効果・想定メリット</span>
                                <p className="text-slate-700 whitespace-pre-line text-[11px]">
                                  {String(effectText).replace(/➔/g, '\n➔')}
                                </p>
                              </div>

                              <div className={`p-3 rounded-lg border ${
                                hasWarning ? "border-red-200 bg-red-50/30" : "border-slate-200 bg-slate-50/50"
                              }`}>
                                <span className={`font-bold block mb-1 ${hasWarning ? "text-red-700" : "text-slate-600"}`}>
                                  ⚠️ 導入における注意点・留意事項
                                </span>
                                <p className={`text-[11px] whitespace-pre-line ${hasWarning ? "text-red-700 font-medium" : "text-slate-500"}`}>
                                  {hasWarning 
                                    ? "※本機材には製品の特性上、運用における【弱点・デメリット・注意点】がデータに含まれています。ご確認ください。"
                                    : "特筆すべき致命的なデメリットは現状マスターデータに報告されていません。"}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-16 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-400 flex justify-between items-center">
              <p>© 2026 PAL CO., LTD. All Solutions Reserved.</p>
              <p>本提案書は社内マスターシステムより安全に自動生成されました。</p>
            </div>
          </div>
        )}
      </div>

    </main>
  );
}