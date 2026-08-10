'use client';

import { useState } from 'react';

interface PairingCardProps {
  defaultCode?: string;
}

export function PairingCard({ defaultCode = 'G4R-D1N' }: PairingCardProps) {
  const [code, setCode] = useState(defaultCode);

  function generateCode() {
    const nextCode = `G${Math.floor(10 + Math.random() * 90)}-${String(Math.floor(100 + Math.random() * 900)).slice(0, 3)}`;
    setCode(nextCode);
  }

  return (
    <div className="rounded-2xl border border-border bg-bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Pairing code</h2>
          <p className="mt-2 text-sm text-text-muted">Share this code with a child device to link it to your family.</p>
        </div>
        <button
          onClick={generateCode}
          className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-primary"
        >
          Generate
        </button>
      </div>

      <div className="mt-4 inline-flex rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-xl font-semibold tracking-[0.3em] text-accent">
        {code}
      </div>
    </div>
  );
}
