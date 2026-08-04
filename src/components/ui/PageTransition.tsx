import React from 'react';

interface PageTransitionProps { activeKey: string; children: React.ReactNode; }

/** Gives every tab switch a deliberate "the page changed" motion — a
 *  distinct animation from the plain fade-in already used inside
 *  individual views, so switching tabs feels different from a section
 *  simply loading. Keying by activeKey doesn't change what unmounts
 *  (the switch-based renderView already fully unmounts inactive views
 *  regardless), it just guarantees the animation replays cleanly on
 *  every switch. */
export function PageTransition({ activeKey, children }: PageTransitionProps) {
  return <div key={activeKey} className="animate-page-enter">{children}</div>;
}