"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // 今日の日付を取得（PDFの発行日用）
  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

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

  const checkIsPalProduct = (maker: string) => {
    if (!maker) return false;
    return maker.trim() === "株式会社PAL";
  };

  const categories = Array.from(new Set(data.map((item) => item.category)));
  const pinnedItems = data.filter((item) => pinnedIds.includes(item.id));
  const pinnedCategories = Array.from(new Set(pinnedItems.map((item) => item.category)));

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
          @page { size: A4 portrait; margin: 15mm 15mm 20mm 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; color: #0f172a !important; }
          .no-print { display: none !important; }
          .page-break { page-break-inside: avoid; page-break-after: auto; }
        }
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>

      {/* =========================================================
          💻 1. Web画面用UI（変更なし）
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
          <div className="flex flex-col items-center justify-center py-32 px-4">
            <div className="relative flex justify-center items-center w-36 h-36 mb-8">
              <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 opacity-80 animate-[spin_3s_linear_infinite]"></div>
              <div className="absolute inset-2 rounded-full border-r-2 border-cyan-400 opacity-60 animate-[spin_2s_linear_infinite_reverse]"></div>
              <div className="absolute inset-4 rounded-full border-b-2 border-indigo-500 opacity-70 animate-[spin_4s_linear_infinite]"></div>
              <div className="bg-slate-900 rounded-full w-20 h-20 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                <img src="/pal-logo.png" alt="PAL Logo" className="h-8 w-auto object-contain animate-pulse" onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>
            </div>
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
                              <span className="text-[10px] font-bold text-slate-500 block mb-0.5">参考価格</span>
                              <span className="text-sm font-bold text-blue-400 block">{item.price || "要問合せ"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
                          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 h-full">
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">■ 目的・用途</span>
                            <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                              {String(item.usage || "─").replace(/➔/g, '\n➔')}
                            </p>
                          </div>
                          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 h-full">
                            <span className="text-[10px] font-bold text-emerald-600 block mb-1">■ 数値効果・特徴</span>
                            <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
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
          📄 2. PDF出力用UI（提案書） - ✨超ハイエンドデザイン仕様
          ========================================================= */}
      <div className="hidden print:block text-slate-900 bg-white font-sans">
        {pinnedItems.length > 0 && (
          <div className="max-w-[190mm] mx-auto">
            
            {/* 🏢 公式ドキュメント風 ヘッダー */}
            <div className="flex justify-between items-end border-b-2 border-slate-800 pb-3 mb-8">
              <div className="flex items-center gap-4">
                <img src="/pal-logo.png" alt="PAL Logo" className="h-12 w-auto object-contain" />
                <div>
                  <div className="text-[9px] font-bold text-blue-800 tracking-widest uppercase mb-0.5">Logistics Automation Proposal</div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">物流自動化・設備導入提案書</h1>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-bold mb-0.5">株式会社PAL | Logistics Solution Division</p>
                <p className="text-[10px] text-slate-500">発行日: {today}</p>
              </div>
            </div>

            <div className="mb-6 text-[11px] text-slate-600 leading-relaxed">
              御社の物流課題・要件に基づき、マスターデータより選定した最適機材の構成案をご提示いたします。
            </div>

            {/* 📌 カテゴリごとの機材データ展開 */}
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
                  <div key={catName} className="space-y-5">
                    
                    {/* ✨ 洗練されたカテゴリ見出し */}
                    <div className="flex items-center mb-4">
                      <div className="h-6 w-1.5 bg-blue-700 mr-3"></div>
                      <h2 className="text-lg font-black text-slate-800 border-b border-slate-300 flex-1 pb-1 flex justify-between items-end">
                        <span>{catName} <span className="text-[11px] font-normal text-slate-500 ml-2 tracking-wide">選定機材</span></span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          計 {sortedPinnedInCategory.length} 機種
                        </span>
                      </h2>
                    </div>

                    <div className="space-y-6">
                      {sortedPinnedInCategory.map((item) => {
                        const effectText = item.effect || "";
                        const hasWarning = effectText.includes("弱点") || effectText.includes("注意") || effectText.includes("デメリット");
                        const isPal = checkIsPalProduct(item.maker);

                        return (
                          /* ✨ データシート風 プロダクトカード */
                          <div key={`print-${item.id}`} className="border border-slate-300 rounded-lg overflow-hidden page-break shadow-sm">
                            
                            {/* カード上部：基本スペックエリア */}
                            <div className="bg-slate-50 border-b border-slate-300 px-5 py-3 flex justify-between items-center">
                              <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                  {isPal && <span className="bg-blue-700 text-white px-2 py-0.5 rounded-sm text-[9px] font-bold tracking-wider">★ PAL ORIGINAL</span>}
                                  <span className="text-[10px] font-bold text-slate-600 border border-slate-300 bg-white px-1.5 py-0.5 rounded-sm shadow-sm">{item.maker}</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 leading-tight">{item.name}</h3>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] font-bold text-slate-500 block mb-0.5">参考価格 / 仕様</span>
                                <span className="text-sm font-black text-blue-900">{item.price || "要問合せ"}</span>
                                <span className="text-[10px] font-medium text-slate-600 ml-1">({item.type || "標準"})</span>
                              </div>
                            </div>

                            {/* カード下部：詳細エリア（絶対崩れない強固なFlex2カラム構造） */}
                            <div className="flex flex-row divide-x divide-slate-300">
                              
                              {/* 左側：用途 */}
                              <div className="w-[45%] p-4 bg-white">
                                <h4 className="text-[11px] font-bold text-slate-800 border-b-2 border-slate-800 inline-block mb-2 pb-0.5">
                                  ■ 導入目的・適用環境
                                </h4>
                                <p className="text-[10px] text-slate-700 whitespace-pre-line leading-relaxed">
                                  {String(item.usage || "情報なし").replace(/➔/g, '\n➔')}
                                </p>
                                {item.link && (
                                  <p className="mt-3 text-[9px] text-blue-600 break-all font-medium">
                                    [参考URL]: {item.link}
                                  </p>
                                )}
                              </div>

                              {/* 右側：効果と留意点 */}
                              <div className="w-[55%] p-4 bg-slate-50/50 flex flex-col gap-3">
                                
                                {/* メリットボックス */}
                                <div className="bg-white border border-emerald-200 border-l-4 border-l-emerald-500 rounded-sm p-3 shadow-sm">
                                  <h4 className="text-[11px] font-bold text-emerald-700 mb-1">
                                    ✓ 期待される導入効果（メリット）
                                  </h4>
                                  <p className="text-[10px] text-slate-700 whitespace-pre-line leading-relaxed">
                                    {String(effectText).replace(/➔/g, '\n➔')}
                                  </p>
                                </div>

                                {/* デメリット/注意点ボックス */}
                                {hasWarning ? (
                                  <div className="bg-white border border-red-200 border-l-4 border-l-red-500 rounded-sm p-3 shadow-sm">
                                    <h4 className="text-[11px] font-bold text-red-700 mb-1">
                                      ⚠ 導入における留意点・制約事項
                                    </h4>
                                    <p className="text-[10px] text-red-700 whitespace-pre-line leading-relaxed font-medium">
                                      ※本機材には製品の特性上、運用における【弱点・デメリット・注意点】がデータに含まれています。ご確認ください。
                                    </p>
                                  </div>
                                ) : (
                                  <div className="bg-white border border-slate-200 border-l-4 border-l-slate-400 rounded-sm p-3 shadow-sm">
                                    <h4 className="text-[11px] font-bold text-slate-600 mb-1">
                                      ℹ 導入における留意点
                                    </h4>
                                    <p className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed">
                                      特筆すべき致命的な制約事項やデメリットは現在マスターに報告されていません。
                                    </p>
                                  </div>
                                )}
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

            {/* フッター */}
            <div className="mt-12 pt-3 border-t border-slate-300 text-[9px] text-slate-400 flex justify-between items-center">
              <p>© {new Date().getFullYear()} PAL CO., LTD. All Solutions Reserved.</p>
              <p>本提案書は社内マスターシステムより安全に自動生成されました。</p>
            </div>
          </div>
        )}
      </div>

    </main>
  );
}