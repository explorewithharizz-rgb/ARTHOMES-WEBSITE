// ART HOME Interiors - Main Application Script
(() => {
  'use strict';

  // 1. Navigation & WhatsApp Form Handlers
  const initNavAndForms = () => {
    const menuButton = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.primary-nav');
    menuButton?.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      menuButton.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      nav.classList.toggle('open', !open);
    });

    const phone = '919791272166';
    const prepareWhatsApp = (text) => {
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    document.querySelectorAll('input[type=tel]').forEach(input => {
      input.addEventListener('input', () => input.setCustomValidity(''));
    });

    const validPhone = (form) => {
      const input = form.querySelector('input[type=tel]');
      const digits = input.value.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        input.setCustomValidity('Please enter a valid phone number.');
        input.reportValidity();
        return false;
      }
      return true;
    };

    const projectForm = document.querySelector('#project-form');
    const formSuccessBox = document.querySelector('#form-success-box');
    const formLeadDesc = document.querySelector('#form-lead-desc');
    const submitAnotherBtn = document.querySelector('#submit-another-btn');

    submitAnotherBtn?.addEventListener('click', () => {
      if (formSuccessBox) formSuccessBox.style.display = 'none';
      if (formLeadDesc) formLeadDesc.style.display = 'block';
      if (projectForm) projectForm.style.display = 'grid';
    });

    if (projectForm) {
      projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validPhone(projectForm)) return;
        const data = new FormData(projectForm);
        const submitBtn = projectForm.querySelector('button[type=submit]');
        const originalText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Submitting enquiry...';
        }

        const payload = {
          name: data.get('name') || '',
          phone: data.get('phone') || '',
          locality: data.get('locality') || '',
          requirement: data.get('requirement') || '',
          notes: data.get('notes') || ''
        };

        try {
          const res = await fetch('/api/submit-enquiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const json = await res.json();
          if (json && json.ok) {
            projectForm.reset();
            // Show big green tick confirmation box
            if (projectForm) projectForm.style.display = 'none';
            if (formLeadDesc) formLeadDesc.style.display = 'none';
            if (formSuccessBox) {
              formSuccessBox.style.display = 'block';
              formSuccessBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          } else {
            throw new Error('Server returned not ok');
          }
        } catch (err) {
          console.error('Submit error:', err);
          projectForm.reset();
          if (projectForm) projectForm.style.display = 'none';
          if (formLeadDesc) formLeadDesc.style.display = 'none';
          if (formSuccessBox) {
            formSuccessBox.style.display = 'block';
            formSuccessBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText || 'Submit Enquiry';
          }
        }
      });
    }

    const refDialog = document.querySelector('#referral-dialog');
    document.querySelectorAll('[data-open-referral]').forEach(button => {
      button.addEventListener('click', () => refDialog?.showModal());
    });
    refDialog?.querySelector('.dialog-close')?.addEventListener('click', () => refDialog.close());
    refDialog?.addEventListener('click', (e) => {
      if (e.target === refDialog) refDialog.close();
    });

    document.querySelector('#referral-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validPhone(e.currentTarget)) return;
      const data = new FormData(e.currentTarget);
      prepareWhatsApp(
        `Hello ART HOME INTERIORS, I would like to refer a friend.\n\n` +
        `Friend’s name: ${data.get('name')}\n` +
        `Friend’s phone number: ${data.get('phone')}`
      );
    });
  };

  // 2. Interactive Gallery Handler
  const initGallery = () => {
    const area = document.querySelector('#gallery-content');
    if (!area) return;

    const resolveSrc = s => {
      if (!s) return '';
      return s.startsWith('/') ? s : '/' + s;
    };

    const categories = [
      { key: 'kitchen', name: 'Modular Kitchen', cover: '/assets/design/kitchen-01.webp', first: 1, last: 8 },
      { key: 'wardrobe', name: 'Wardrobes', cover: '/assets/design/wardrobe-09.webp', first: 9, last: 13 },
      { key: 'partition', name: 'Living Room Partition', cover: '/assets/design/partition-15.webp', first: 14, last: 17 },
      { key: 'tv', name: 'TV Units', cover: '/assets/design/tv-18.webp', first: 18, last: 20 },
      { key: 'pooja', name: 'Pooja Units', cover: '/assets/design/pooja-21.webp', first: 21, last: 22 },
      { key: 'kids', name: 'Kids Room', cover: '/assets/design/kids-23.webp', first: 23, last: 24 }
    ];

    const design = categories.flatMap(c =>
      Array.from({ length: c.last - c.first + 1 }, (_, i) => ({
        category: c.key,
        title: `${c.name} design ${i + 1}`,
        src: `/assets/design/${c.key}-${String(c.first + i).padStart(2, '0')}.webp`
      }))
    );

    const executionNames = {
      kitchen: 'Modular Kitchens',
      wardrobe: 'Wardrobes',
      partition: 'Living Partitions',
      tv: 'TV Units',
      pooja: 'Pooja Units',
      bedroom: 'Bedrooms'
    };

    const query = new URLSearchParams(location.search);
    const initial = query.get('view');
    const view = ['design', 'execution'].includes(initial) ? initial : 'design';

    document.querySelectorAll('[data-gallery-tab]').forEach(a => {
      if (a.dataset.galleryTab === view) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });

    const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    const openDialog = document.querySelector('#lightbox');
    const image = document.querySelector('#lightbox-image');
    const caption = document.querySelector('#lightbox-caption');
    let currentPhotos = [], currentIndex = 0;

    function showImage(index) {
      if (!currentPhotos.length) return;
      currentIndex = (index + currentPhotos.length) % currentPhotos.length;
      const photo = currentPhotos[currentIndex];
      if (image) {
        image.src = resolveSrc(photo.src);
        image.alt = photo.title;
      }
      if (caption) {
        caption.textContent = `${photo.title} · ${currentIndex + 1} of ${currentPhotos.length}`;
      }
    }

    function wirePhotos(photos) {
      currentPhotos = photos;
      area.querySelectorAll('[data-photo-index]').forEach(button => {
        button.addEventListener('click', () => {
          showImage(Number(button.dataset.photoIndex));
          openDialog?.showModal();
        });
      });
    }

    if (openDialog) {
      openDialog.querySelector('.lightbox-close')?.addEventListener('click', () => openDialog.close());
      openDialog.querySelector('.lightbox-next')?.addEventListener('click', () => showImage(currentIndex + 1));
      openDialog.querySelector('.lightbox-prev')?.addEventListener('click', () => showImage(currentIndex - 1));
      openDialog.addEventListener('click', e => { if (e.target === openDialog) openDialog.close(); });
      window.addEventListener('keydown', e => {
        if (!openDialog.open) return;
        if (e.key === 'ArrowRight') showImage(currentIndex + 1);
        if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
      });
    }

    const cards = photos => `
      <div class="gallery-grid">
        ${photos.map((p, i) => `
          <button class="photo-card" type="button" data-photo-index="${i}" aria-label="View ${escapeHTML(p.title)}">
            <div class="image-wrap">
              <img src="${resolveSrc(p.src)}" alt="${escapeHTML(p.title)}" loading="lazy" decoding="async">
            </div>
            <p>${escapeHTML(p.title)}</p>
          </button>
        `).join('')}
      </div>
    `;

    function updateURL(key) {
      const u = new URL(location.href);
      if (key === 'all') u.searchParams.delete('category');
      else u.searchParams.set('category', key);
      history.replaceState(null, '', u);
    }

    function renderDesign(selected) {
      if (!categories.some(c => c.key === selected)) selected = 'all';
      const shown = selected === 'all' ? design : design.filter(p => p.category === selected);
      const name = categories.find(c => c.key === selected)?.name || 'All designs';

      area.innerHTML = `
        <div class="gallery-top fade-up is-visible">
          <div>
            <p class="kicker">DESIGN COLLECTION</p>
            <h2>Find inspiration by space.</h2>
            <p>Choose a category to explore design ideas for your space.</p>
          </div>
          <span class="count">${design.length} design images</span>
        </div>
        <div class="category-grid">
          ${categories.map(c => `
            <button class="category-card ${c.key === selected ? 'selected' : ''}" type="button" data-category="${c.key}" aria-label="View ${escapeHTML(c.name)} designs" aria-pressed="${c.key === selected}">
              <img src="${resolveSrc(c.cover)}" alt="" loading="eager" decoding="async">
              <span>${escapeHTML(c.name)}</span>
            </button>
          `).join('')}
        </div>
        <div id="gallery-results">
          <div class="gallery-results-head fade-up is-visible">
            <h3>${escapeHTML(name)}</h3>
            <span>${shown.length} ${shown.length === 1 ? 'image' : 'images'}</span>
          </div>
          <div class="filter-row fade-up is-visible">
            <button type="button" data-category="all" class="${selected === 'all' ? 'active' : ''}" aria-pressed="${selected === 'all'}">All designs</button>
            ${categories.map(c => `
              <button type="button" data-category="${c.key}" class="${selected === c.key ? 'active' : ''}" aria-pressed="${selected === c.key}">${escapeHTML(c.name)}</button>
            `).join('')}
          </div>
          ${cards(shown)}
        </div>
      `;

      area.querySelectorAll('[data-category]').forEach(b => {
        b.addEventListener('click', () => {
          renderDesign(b.dataset.category);
          updateURL(b.dataset.category);
          document.querySelector('#gallery-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
      wirePhotos(shown);
    }

    function renderExecution(all, selected) {
      if (!Object.keys(executionNames).includes(selected)) selected = 'all';
      const shown = selected === 'all' ? all : all.filter(p => p.category === selected);

      area.innerHTML = `
        <div class="gallery-top fade-up is-visible">
          <div>
            <p class="kicker">EXECUTION COLLECTION</p>
            <h2>Explore our work.</h2>
            <p>Explore our interior execution collection.</p>
          </div>
          <span class="count">${all.length} gallery images</span>
        </div>
        <div class="filter-row fade-up is-visible">
          ${[['all', 'All work'], ...Object.entries(executionNames)].map(([k, n]) => `
            <button type="button" data-exec-filter="${k}" class="${selected === k ? 'active' : ''}" aria-pressed="${selected === k}">${n}</button>
          `).join('')}
        </div>
        <div class="gallery-results-head fade-up is-visible">
          <h3>${escapeHTML(selected === 'all' ? 'All work' : executionNames[selected])}</h3>
          <span>${shown.length} images</span>
        </div>
        ${cards(shown)}
      `;

      area.querySelectorAll('[data-exec-filter]').forEach(b => {
        b.addEventListener('click', () => {
          renderExecution(all, b.dataset.execFilter);
          updateURL(b.dataset.execFilter);
        });
      });
      wirePhotos(shown);
    }

    if (view === 'design') {
      renderDesign(query.get('category') || 'all');
    } else {
      fetch('/assets/execution.json')
        .then(r => {
          if (!r.ok) throw Error('Gallery could not load');
          return r.json();
        })
        .then(data => renderExecution(data, query.get('category') || 'all'))
        .catch(() => {
          area.innerHTML = '<p>We could not load the execution images. Please refresh the page.</p>';
        });
    }
  };

  // 3. Directional Smooth Scroll & Entrance Animations (Fade Up, Fade Left, Fade Right)
  const initGlobalAnimations = () => {
    // A. Sticky Header Elevation
    const header = document.querySelector('.site-header');
    if (header) {
      const handleScroll = () => {
        header.classList.toggle('header-elevated', window.scrollY > 20);
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }

    // B. Tag Elements with Directional Animations
    const applyAnimationClasses = (root = document) => {
      // Fade Left (left column content)
      root.querySelectorAll('.hero-copy, .details > .detail-copy, .contact-heading-left, .referral-card-side, .about-story').forEach(el => {
        if (!el.classList.contains('anim-tagged')) {
          el.classList.add('anim-tagged', 'fade-left');
        }
      });

      // Fade Right (right column content, images, forms)
      root.querySelectorAll('.hero-photo, .details > .detail-image, .contact-info-compact, .contact-form-card, .about-image').forEach(el => {
        if (!el.classList.contains('anim-tagged')) {
          el.classList.add('anim-tagged', 'fade-right');
        }
      });

      // Fade Up (intro section, section headings, cards, process steps, service items, principles, footer)
      root.querySelectorAll('.intro > div, .section-head, .feature-card, .process-grid article, .service-summary article, .principles article, .cta-inner, .studio-map-panoramic-section, .footer-grid > div, .gallery-top, .gallery-tabs').forEach(el => {
        if (!el.classList.contains('anim-tagged')) {
          el.classList.add('anim-tagged', 'fade-up');
        }
      });

      // Stagger delays inside intro & grids
      root.querySelectorAll('.intro').forEach(intro => {
        Array.from(intro.children).forEach((child, i) => {
          if (!child.style.transitionDelay) {
            child.style.transitionDelay = `${i * 0.15}s`;
          }
        });
      });

      // Stagger delays inside grids
      root.querySelectorAll('.process-grid, .feature-grid, .principles, .footer-grid').forEach(grid => {
        Array.from(grid.children).forEach((child, i) => {
          if (!child.style.transitionDelay) {
            child.style.transitionDelay = `${(i % 8) * 0.08}s`;
          }
        });
      });
    };

    applyAnimationClasses();

    // C. Intersection Observer for Scroll Triggering
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.05
    });

    // Check all elements; reveal instantly if in viewport or observe on scroll
    const triggerObserver = (root = document) => {
      root.querySelectorAll('.fade-up, .fade-left, .fade-right, .fade-scale').forEach(el => {
        if (!el.classList.contains('is-visible')) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            requestAnimationFrame(() => el.classList.add('is-visible'));
          } else {
            observer.observe(el);
          }
        }
      });
    };

    triggerObserver();
  };

  // 4. Initialize All Systems
  const initApp = () => {
    initNavAndForms();
    initGallery();
    initGlobalAnimations();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
