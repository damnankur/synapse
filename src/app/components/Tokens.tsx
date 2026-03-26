import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Coins,
  CreditCard,
  Loader2,
  ShieldCheck,
  Sparkles,   
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { TokenBundle } from '../types'

const TOKEN_BUNDLES: TokenBundle[] = [
  { id: 'starter', amount: 10, priceLabel: '$5', description: 'Kick off a quick application.' },
  {
    id: 'builder',
    amount: 25,
    priceLabel: '$12',
    badge: 'Popular',
    description: 'Enough to apply and publish with headroom.',
  },
  {
    id: 'lab',
    amount: 50,
    priceLabel: '$22',
    badge: 'Best value',
    description: 'Stock up for a full research sprint.',
  },
];

async function mockCreatePaymentIntent(amount: number) {
  await new Promise((res) => setTimeout(res, 400));
  return { intentId: `pi_${Date.now()}`, amount };
}

async function mockConfirmPayment(intentId: string) {
  await new Promise((res) => setTimeout(res, 750));
  return { status: 'succeeded', receiptId: `rcpt_${intentId}` };
}

export function Tokens() {
  const { user, purchaseTokens } = useApp();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const usageSummary = useMemo(
    () => [
      { label: 'Apply to a project', delta: -10 },
      { label: 'Publish a project', delta: -10 },
      { label: 'Complete your role', delta: +30 },
    ],
    []
  );

  const handlePurchase = async (bundle: TokenBundle) => {
    setProcessingId(bundle.id);
    try {
      const intent = await mockCreatePaymentIntent(bundle.amount);
      await mockConfirmPayment(intent.intentId);
      await purchaseTokens(bundle.amount);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-4">
        <Coins size={18} className="text-amber-500" />
        <p className="text-xs font-semibold text-[#003D7A]/80 uppercase tracking-wider">Token Wallet</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div
            className="rounded-2xl border border-[#003D7A]/10 bg-gradient-to-r from-[#003D7A] via-[#1a2f6e] to-[#6B4C9A] text-white p-6 shadow-lg"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-white/70 mb-1">Available tokens</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold tabular-nums">{user.tokens}</span>
                  <span className="text-xs uppercase tracking-widest text-white/60">tokens</span>
                </div>
                <p className="text-xs text-white/60 mt-2">
                  Keep at least 10 tokens on hand so you can apply or publish without friction.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 border border-white/15">
                <ShieldCheck size={15} className="text-emerald-200" />
                <span className="text-xs text-white/80">
                  Payments are stubbed with a dummy API for this demo.
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {TOKEN_BUNDLES.map((bundle) => (
              <div
                key={bundle.id}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{bundle.amount} tokens</p>
                    <p className="text-xs text-gray-500">{bundle.description}</p>
                  </div>
                  {bundle.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#17A2B8]/10 text-[#17A2B8] font-semibold uppercase tracking-wide">
                      {bundle.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#003D7A]">{bundle.priceLabel}</span>
                  <span className="text-xs text-gray-400">dummy checkout</span>
                </div>

                <button
                  type="button"
                  onClick={() => handlePurchase(bundle)}
                  disabled={processingId !== null}
                  className={`inline-flex items-center justify-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl transition-colors ${
                    processingId === bundle.id
                      ? 'bg-[#003D7A]/70 text-white cursor-wait'
                      : 'bg-[#003D7A] text-white hover:bg-[#1a2f6e]'
                  }`}
                >
                  {processingId === bundle.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Processing
                    </>
                  ) : (
                    <>
                      Buy tokens <ArrowRight size={14} />
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <CreditCard size={13} />
                  <span>Charges are simulated; backend/payment APIs are mocked.</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-[#17A2B8]" />
              <p className="text-sm font-semibold text-gray-900">How tokens flow</p>
            </div>
            <ul className="space-y-2">
              {usageSummary.map((item) => (
                <li key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span
                    className={`text-xs font-bold ${
                      item.delta > 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {item.delta > 0 ? '+' : ''}
                    {item.delta}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-3">
              <Clock3 size={12} />
              <span>Transfers settle instantly after the dummy payment steps finish.</span>
            </div>
          </div>

          <div className="bg-[#003D7A]/5 border border-[#003D7A]/10 rounded-2xl p-4 text-sm text-[#003D7A]">
            <div className="flex items-center gap-2 font-semibold mb-2">
              <CheckCircle2 size={16} />
              Safe sandbox flow
            </div>
            <p className="text-[#003D7A]/80">
              Purchases call mocked backend/payment endpoints so you can test the experience without
              real cards. Replace <code>mockCreatePaymentIntent</code> and{' '}
              <code>mockConfirmPayment</code> with live APIs when ready.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
