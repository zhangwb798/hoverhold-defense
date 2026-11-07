(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const rebounds = new WeakMap();

  document.addEventListener('click', event => {
    const button = event.target.closest?.('button:enabled:not([aria-disabled="true"])');
    if (!button || reducedMotion.matches) return;
    const dataKey = button.getAttributeNames().find(name => name.startsWith('data-'));
    const scopeId = button.parentElement.closest('[id]')?.id;
    const selector = dataKey && `button[${dataKey}="${CSS.escape(button.getAttribute(dataKey))}"]`;

    requestAnimationFrame(() => {
      // Some menus rebuild their buttons during the click handler.
      const control = button.isConnected ? button : button.id ? document.getElementById(button.id)
        : selector ? (scopeId ? document.getElementById(scopeId) : document)?.querySelector(selector) : null;
      if (!control?.getClientRects().length || reducedMotion.matches) return;
      rebounds.get(control)?.cancel();
      rebounds.set(control, control.animate(
        [{scale: '.96'}, {scale: '1.025', offset: .62}, {scale: '1'}],
        {duration: 210, easing: 'cubic-bezier(.2,.7,.3,1)'}
      ));
    });
  }, {capture: true});
})();
