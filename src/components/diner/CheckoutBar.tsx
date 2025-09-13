"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  cartItemsCount: number;      // existing prop/state
  isCartOpen?: boolean;        // hide when cart sidebar is open
  isProcessing?: boolean;      // hide when checkout is processing
  children: React.ReactNode;   // your existing bar markup (unchanged)
};

export default function CheckoutBar({ cartItemsCount, isCartOpen = false, isProcessing = false, children }: Props) {
  const visible = cartItemsCount > 0 && !isCartOpen && !isProcessing; // hide when cart sidebar is open or processing
  const [mounted, setMounted] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const [spacerH, setSpacerH] = useState(0);

  useEffect(() => setMounted(true), []);

  // Measure actual rendered height (includes safe-area padding)
  useLayoutEffect(() => {
    if (!visible) { setSpacerH(0); return; }
    const el = barRef.current;
    if (!el) return;

    const recalc = () => setSpacerH(el.offsetHeight);
    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    window.addEventListener("orientationchange", recalc);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", recalc);
    };
  }, [visible]);

  if (!mounted || !visible) return null;

  const node = (
    <>
      {/* Fixed wrapper prevents overlap with URL bar via safe-area padding */}
      <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
        <div className="mx-auto max-w-[480px] px-4">
          <div
            ref={barRef}
            className="pointer-events-auto pb-[calc(var(--safe-bottom)+12px)]"
            role="region"
            aria-label="Checkout"
          >
            {/* render your existing bar EXACTLY as-is */}
            {children}
          </div>
        </div>
      </div>

      {/* Dynamic spacer uses the measured height so content never hides behind bar */}
      <div aria-hidden style={{ height: spacerH }} />
    </>
  );

  return createPortal(node, document.body);
}
