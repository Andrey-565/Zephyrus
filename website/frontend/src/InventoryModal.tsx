import React, { useState, useEffect, useCallback } from 'react';
import zephyrIcon from './assets/zephyr_coin.png';

interface InventoryItem {
  slot: number;
  item_type: string;
  item_count: number;
  item_name: string;
  item_nbt: string | null;
}

interface InventoryData {
  unlocked_slots: number;
  max_slots: number;
  next_unlock_cost: number | null;
  next_unlock_count: number;
  items: InventoryItem[];
}

interface Props {
  onClose: () => void;
  zephyrBalance: number;
  onBalanceChange: (newBalance: number) => void;
}

const TOTAL_SLOTS = 54;
const COLS = 9;

function getItemIcon(itemType: string): string {
  const name = itemType.replace('minecraft:', '');
  return `https://assets.mcasset.cloud/1.21.1/assets/minecraft/textures/item/${name}.png`;
}

export default function InventoryModal({ onClose, zephyrBalance, onBalanceChange }: Props) {
  const [inv, setInv] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [converting, setConverting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [balance, setBalance] = useState(zephyrBalance);

  const token = localStorage.getItem('zephyrus-token');

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchInv = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/inventory', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setInv(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchInv(); }, [fetchInv]);

  const handleUnlock = async () => {
    if (!inv?.next_unlock_cost) return;
    setUnlocking(true);
    const res = await fetch('http://localhost:8000/api/inventory/unlock', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message, true);
      setBalance(data.zephyr_balance);
      onBalanceChange(data.zephyr_balance);
      await fetchInv();
    } else {
      showToast(data.detail, false);
    }
    setUnlocking(false);
  };

  const handleConvert = async () => {
    setConverting(true);
    const res = await fetch('http://localhost:8000/api/inventory/convert-to-diamond', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message, true);
      setBalance(data.zephyr_balance);
      onBalanceChange(data.zephyr_balance);
      await fetchInv();
    } else {
      showToast(data.detail, false);
    }
    setConverting(false);
  };

  const itemMap = new Map<number, InventoryItem>();
  inv?.items.forEach(i => itemMap.set(i.slot, i));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-[var(--container-bg)] border border-[var(--border-color)] rounded-[32px] p-6 shadow-2xl backdrop-blur-2xl animate-[fadeIn_0.3s_ease-out]">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-xl font-black text-[var(--text-title)] uppercase tracking-tight">☁️ Облачный инвентарь</h3>
            <p className="text-xs opacity-50 mt-0.5">Двойной сундук · {inv?.unlocked_slots ?? 0} / {TOTAL_SLOTS} слотов разблокировано</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[var(--feature-bg)] border border-[var(--border-color)] px-3 py-1.5 rounded-full text-sm font-black">
              <img src={zephyrIcon} className="w-4 h-4 rounded-full" alt="" />
              {balance.toLocaleString()}
            </div>
            <button onClick={onClose} className="opacity-40 hover:opacity-100 transition-opacity">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Chest Grid */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>
        ) : (
          <div
            className="grid gap-1.5 p-4 rounded-2xl border border-[var(--border-color)] bg-black/[0.08]"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
          >
            {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
              const unlocked = (inv?.unlocked_slots ?? 0) > i;
              const item = itemMap.get(i);
              return (
                <div
                  key={i}
                  title={item ? `${item.item_name} ×${item.item_count}` : unlocked ? 'Пусто' : 'Заблокировано'}
                  className={`relative aspect-square rounded-lg flex items-center justify-center text-[10px] font-black transition-all
                    ${unlocked
                      ? item
                        ? 'bg-[var(--feature-bg)] border border-[var(--border-color)] hover:border-purple-500/50 cursor-pointer'
                        : 'bg-white/[0.04] border border-[var(--border-color)] border-dashed'
                      : 'bg-black/20 border border-black/10 cursor-not-allowed'
                    }`}
                >
                  {item ? (
                    <>
                      <img
                        src={getItemIcon(item.item_type)}
                        alt={item.item_name}
                        className="w-8 h-8 object-contain pixelated"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://assets.mcasset.cloud/1.21.1/assets/minecraft/textures/item/barrier.png'; }}
                      />
                      {item.item_count > 1 && (
                        <span className="absolute bottom-0.5 right-1 text-white text-[9px] font-black drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">{item.item_count}</span>
                      )}
                    </>
                  ) : !unlocked ? (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-20"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          {/* Unlock slots */}
          {inv && inv.unlocked_slots < TOTAL_SLOTS && (
            <button
              onClick={handleUnlock}
              disabled={unlocking || balance < (inv.next_unlock_cost ?? 0)}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-black rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-95 text-sm"
            >
              {unlocking ? 'Разблокировка...' : (
                inv.unlocked_slots === 0
                  ? `🔓 Открыть 3 слота · ${inv.next_unlock_cost} 🪙`
                  : `🔓 Открыть слот · ${inv.next_unlock_cost} 🪙`
              )}
            </button>
          )}

          {/* Convert to diamond */}
          <button
            onClick={handleConvert}
            disabled={converting || balance < 10}
            className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-black rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-95 text-sm"
          >
            {converting ? 'Конвертация...' : '10 🪙 → 1 💎 в инвентарь'}
          </button>
        </div>

        {/* Hint */}
        <p className="text-center text-[11px] opacity-30 mt-3 font-bold">
          Команда на сервере: <code>/chest</code> — открыть, <code>/exchange &lt;кол-во&gt;</code> — конвертировать алмазы
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-white font-black text-sm shadow-xl animate-[fadeIn_0.2s_ease-out] z-[300] ${toast.ok ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
