(() => {
  'use strict';

  const RED = '#FF3B30';
  const DEEP_RED = '#D92D20';
  const ERROR = '#A61B16';
  const activeClasses = ['bg-primary', 'text-on-primary', 'shadow-sm'];
  const inactiveClasses = ['text-on-surface-variant'];

  const style = document.createElement('style');
  style.textContent = `
    .ember-toast-host { position: fixed; right: 20px; bottom: 24px; z-index: 10020; display: grid; gap: 8px; pointer-events: none; }
    .ember-toast { max-width: 360px; padding: 12px 16px; border-radius: 8px; color: #fff; background: #1D1D1F; box-shadow: 0 16px 48px rgba(0,0,0,.22); font: 600 14px/1.4 Manrope, sans-serif; opacity: 0; transform: translateY(8px); transition: opacity .18s ease, transform .18s ease; }
    .ember-toast.is-visible { opacity: 1; transform: translateY(0); }
    .ember-dialog-backdrop { position: fixed; inset: 0; z-index: 10000; display: grid; place-items: center; padding: 20px; background: rgba(0,0,0,.58); backdrop-filter: blur(8px); }
    .ember-dialog { width: min(520px, 100%); max-height: min(760px, calc(100vh - 40px)); overflow: auto; border-radius: 12px; background: #fff; color: #1D1D1F; box-shadow: 0 30px 90px rgba(0,0,0,.32); }
    .ember-dialog__header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 22px 24px; border-bottom: 1px solid #D2D2D7; }
    .ember-dialog__title { margin: 0; font: 600 26px/1.1 Poppins, sans-serif; letter-spacing: -.03em; }
    .ember-dialog__close { width: 44px; height: 44px; border: 0; border-radius: 50%; background: #EEEEF0; color: #1D1D1F; cursor: pointer; font-size: 22px; }
    .ember-dialog__body { display: grid; gap: 16px; padding: 24px; }
    .ember-field { display: grid; gap: 7px; font: 600 12px/1.4 Manrope, sans-serif; letter-spacing: .04em; text-transform: uppercase; }
    .ember-field input, .ember-field textarea, .ember-field select { width: 100%; min-height: 48px; padding: 12px 14px; border: 1px solid #D2D2D7; border-radius: 6px; background: #fff; color: #1D1D1F; font: 400 15px/1.5 Manrope, sans-serif; letter-spacing: normal; text-transform: none; }
    .ember-field textarea { min-height: 120px; resize: vertical; }
    .ember-field input:focus, .ember-field textarea:focus, .ember-field select:focus { outline: 2px solid ${RED}; outline-offset: 2px; border-color: #1D1D1F; }
    .ember-dialog__actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 6px; }
    .ember-action { min-height: 48px; padding: 12px 18px; border: 1px solid #1D1D1F; border-radius: 6px; background: #fff; color: #1D1D1F; cursor: pointer; font: 700 13px/1 Manrope, sans-serif; }
    .ember-action--primary { border-color: ${RED}; background: ${RED}; color: #fff; }
    .ember-action--primary:hover { background: ${DEEP_RED}; }
    .ember-action--danger { border-color: ${ERROR}; background: ${ERROR}; color: #fff; }
    .ember-list-view { position: absolute; inset: 0; z-index: 15; overflow: auto; padding: 20px 16px 180px; background: #F5F5F7; }
    .ember-list-card { margin-bottom: 12px; padding: 18px; border: 1px solid #D2D2D7; border-radius: 10px; background: #fff; }
    .ember-list-card strong { display: block; margin-bottom: 6px; font: 600 17px/1.25 Poppins, sans-serif; }
    .ember-list-card span { color: #6E6E73; font: 400 13px/1.45 Manrope, sans-serif; }
    @media (max-width: 640px) { .ember-toast-host { left: 16px; right: 16px; bottom: 88px; } .ember-toast { max-width: none; } .ember-dialog-backdrop { place-items: end center; padding: 0; } .ember-dialog { width: 100%; max-height: 88vh; border-radius: 16px 16px 0 0; } }
    @media (prefers-reduced-motion: reduce) { .ember-toast { transition: none; } }
  `;
  document.head.appendChild(style);

  const toastHost = document.createElement('div');
  toastHost.className = 'ember-toast-host';
  toastHost.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastHost);

  function toast(message) {
    const item = document.createElement('div');
    item.className = 'ember-toast';
    item.textContent = message;
    toastHost.appendChild(item);
    requestAnimationFrame(() => item.classList.add('is-visible'));
    window.setTimeout(() => {
      item.classList.remove('is-visible');
      window.setTimeout(() => item.remove(), 220);
    }, 2600);
  }

  function textOf(control) {
    const aria = control.getAttribute('aria-label');
    const text = (aria || control.textContent || '').replace(/\s+/g, ' ').trim();
    return text.toLowerCase();
  }

  function closeDialog() {
    const backdrop = document.querySelector('.ember-dialog-backdrop');
    if (!backdrop) return;
    backdrop.remove();
    document.body.style.overflow = '';
  }

  function dialogMarkup(kind) {
    const configurations = {
      request: {
        title: 'Post a request',
        submit: 'Publish request',
        success: 'Request published. Nearby sellers can now respond.',
        fields: `
          <label class="ember-field">What do you need?<textarea name="request" required placeholder="Describe the product or service you are looking for"></textarea></label>
          <label class="ember-field">Budget<input name="budget" required placeholder="$50–$100" /></label>
          <label class="ember-field">Location<input name="location" required value="Austin, Texas" /></label>`
      },
      signin: {
        title: 'Sign in to EMBER',
        submit: 'Continue',
        success: 'Sign-in details accepted for this prototype.',
        fields: `<label class="ember-field">Email<input name="email" type="email" required autocomplete="email" placeholder="you@example.com" /></label>`
      },
      bid: {
        title: 'Submit a bid',
        submit: 'Send proposal',
        success: 'Bid submitted. You can track it from your workspace.',
        fields: `
          <label class="ember-field">Your price<input name="price" type="number" min="1" required placeholder="75" /></label>
          <label class="ember-field">Message<textarea name="message" required placeholder="Explain how you can fulfill this request"></textarea></label>`
      },
      filters: {
        title: 'Filter demand',
        submit: 'Apply filters',
        success: 'Filters applied.',
        fields: `
          <label class="ember-field">Category<select name="category"><option>All categories</option><option>Food & meal prep</option><option>Home services</option><option>Learning</option></select></label>
          <label class="ember-field">Radius<select name="radius"><option>3 miles</option><option selected>5 miles</option><option>10 miles</option></select></label>`
      },
      message: {
        title: 'Send a message',
        submit: 'Send message',
        success: 'Message sent.',
        fields: `<label class="ember-field">Message<textarea name="message" required placeholder="Write a clear message"></textarea></label>`
      },
      search: {
        title: 'Search EMBER',
        submit: 'Search',
        success: 'Search updated.',
        fields: `<label class="ember-field">Search requests<input name="query" type="search" required autofocus placeholder="Meals, repairs, lessons…" /></label>`
      }
    };
    return configurations[kind] || configurations.search;
  }

  function openDialog(kind) {
    closeDialog();
    const config = dialogMarkup(kind);
    const backdrop = document.createElement('div');
    backdrop.className = 'ember-dialog-backdrop';
    backdrop.innerHTML = `
      <section class="ember-dialog" role="dialog" aria-modal="true" aria-labelledby="ember-dialog-title">
        <header class="ember-dialog__header">
          <h2 class="ember-dialog__title" id="ember-dialog-title">${config.title}</h2>
          <button class="ember-dialog__close" type="button" aria-label="Close dialog">×</button>
        </header>
        <form class="ember-dialog__body" data-ember-success="${config.success}">
          ${config.fields}
          <div class="ember-dialog__actions">
            <button class="ember-action" type="button" data-ember-cancel>Cancel</button>
            <button class="ember-action ember-action--primary" type="submit">${config.submit}</button>
          </div>
        </form>
      </section>`;
    backdrop.addEventListener('click', event => {
      if (event.target === backdrop || event.target.closest('.ember-dialog__close') || event.target.closest('[data-ember-cancel]')) closeDialog();
    });
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';
    backdrop.querySelector('input, textarea, select, button')?.focus();
  }

  function toggleSave(control) {
    const pressed = control.getAttribute('aria-pressed') === 'true';
    control.setAttribute('aria-pressed', String(!pressed));
    const icon = control.querySelector('.material-symbols-outlined');
    if (icon) {
      icon.textContent = pressed ? (icon.textContent.includes('favorite') ? 'favorite_border' : 'bookmark_border') : (icon.textContent.includes('favorite') ? 'favorite' : 'bookmark');
      icon.style.fontVariationSettings = pressed ? '' : "'FILL' 1";
      icon.style.color = pressed ? '' : RED;
    }
    toast(pressed ? 'Removed from saved items.' : 'Saved to your EMBER account.');
  }

  function activateSegment(control) {
    const group = control.parentElement;
    if (!group) return;
    [...group.children].filter(item => item.matches('button, a')).forEach(item => {
      item.setAttribute('aria-selected', String(item === control));
      if (item === control) {
        activeClasses.forEach(name => item.classList.add(name));
        inactiveClasses.forEach(name => item.classList.remove(name));
      } else {
        activeClasses.forEach(name => item.classList.remove(name));
        inactiveClasses.forEach(name => item.classList.add(name));
      }
    });
  }

  function switchDemandView(mode, control) {
    activateSegment(control);
    const map = document.querySelector('.flex-grow.relative.bg-surface-container');
    if (!map) return toast(`${mode} view selected.`);
    let list = map.querySelector('.ember-list-view');
    if (mode === 'List') {
      if (!list) {
        list = document.createElement('section');
        list.className = 'ember-list-view';
        list.setAttribute('aria-label', 'Demand request list');
        list.innerHTML = `
          <article class="ember-list-card"><strong>18 requests for homemade meals</strong><span>South Austin · $15–$25 per meal · High demand</span></article>
          <article class="ember-list-card"><strong>12 households need recurring lawn care</strong><span>4 miles away · Weekly · Moderate demand</span></article>
          <article class="ember-list-card"><strong>8 students looking for calculus tutoring</strong><span>6 miles away · 2 active bids</span></article>`;
        map.appendChild(list);
      }
      list.hidden = false;
    } else if (list) {
      list.hidden = true;
    }
    toast(`${mode} view selected.`);
  }

  function confirmWithdrawal(control) {
    if (control.dataset.emberConfirm === 'true') {
      control.dataset.emberConfirm = 'false';
      toast('Bid withdrawn.');
      return;
    }
    control.dataset.emberConfirm = 'true';
    toast('Select Withdraw Bid again to confirm.');
    window.setTimeout(() => { control.dataset.emberConfirm = 'false'; }, 5000);
  }

  function submitEmbeddedBid() {
    const sheet = document.getElementById('bid-sheet');
    const form = sheet?.querySelector('form');
    if (form && !form.reportValidity()) return;
    sheet?.classList.remove('open');
    document.getElementById('bid-sheet-backdrop')?.classList.remove('open');
    document.body.style.overflow = '';
    toast('Bid submitted. You can track it from your workspace.');
  }

  function navigatePrototype(label) {
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    let destination = '';
    if (/^(ember|home)$/.test(label)) destination = 'home-desktop.html';
    else if (/discover|markets|explore local demand|explore new demand|open.*map|demand map|view aggregate/.test(label)) destination = isMobile ? 'demand-map-mobile.html' : 'demand-map-desktop.html';
    else if (/^requests$|inspect requests|review .*requests|view .*requests|view details|explore opportunity/.test(label)) destination = isMobile ? 'request-detail-mobile.html' : 'request-detail-italian-meals-desktop.html';
    else if (/seller workspace|my bids/.test(label)) destination = isMobile ? 'seller-dashboard-mobile.html' : 'seller-dashboard-desktop.html';
    if (!destination) return false;
    window.location.assign(destination);
    return true;
  }

  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    if (!form.reportValidity()) return;
    const message = form.dataset.emberSuccess || 'Saved.';
    closeDialog();
    const sheet = document.getElementById('bid-sheet');
    const sheetBackdrop = document.getElementById('bid-sheet-backdrop');
    sheet?.classList.remove('open');
    sheetBackdrop?.classList.remove('open');
    document.body.style.overflow = '';
    toast(message);
  });

  document.addEventListener('click', event => {
    const control = event.target.closest('button, a');
    if (!control || control.closest('.ember-dialog')) return;
    const label = textOf(control);
    if (control.matches('a[href="#"]')) event.preventDefault();

    if (/save|saved|favorite|bookmark/.test(label)) return toggleSave(control);
    if (/post a request|publish request|make a request/.test(label)) return openDialog('request');
    if (/sign in|account|profile/.test(label)) return openDialog('signin');
    if (/search/.test(label)) return openDialog('search');
    if (/filter|category|radius/.test(label)) return openDialog('filters');
    if (/message|reply/.test(label)) return openDialog('message');
    if (/withdraw bid/.test(label)) return confirmWithdrawal(control);
    if (/send proposal/.test(label)) return submitEmbeddedBid();
    if (/submit a bid|submit bid|place bid/.test(label) && control.id !== 'open-bid-sheet') return openDialog('bid');

    if (control.tagName === 'BUTTON' && (label === 'map' || label === 'list')) return switchDemandView(label[0].toUpperCase() + label.slice(1), control);
    if (/buying|selling|^all$|^active|^accepted|^closed|opportunities|individual requests|clusters/.test(label)) {
      activateSegment(control);
      return toast(`${control.textContent.replace(/\s+/g, ' ').trim()} selected.`);
    }
    if (navigatePrototype(label)) return;
    if (/zoom in|^add$/.test(label)) return toast('Map zoomed in.');
    if (/zoom out|^remove$/.test(label)) return toast('Map zoomed out.');
    if (/recenter|my_location/.test(label)) return toast('Map recentered on Austin.');
    if (/share/.test(label)) return toast('Share link ready.');
    if (/notifications/.test(label)) return toast('You have no new notifications.');
    if (/menu/.test(label)) return toast('Navigation menu opened.');
    if (/reset/.test(label)) return toast('Filters reset.');
    if (/explore|view|review|open|build|edit bid|create test plan/.test(label)) return toast(`${control.textContent.replace(/\s+/g, ' ').trim()} selected.`);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeDialog();
  });
})();
