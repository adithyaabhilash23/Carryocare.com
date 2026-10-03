// CarryO Care — Scripts
// ── PROGRESS BAR
const pb = document.getElementById('progressBar');
function updateProgress() {
  const h = document.documentElement;
  const pct = (h.scrollTop || document.body.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
  pb.style.width = pct + '%';
}
window.addEventListener('scroll', updateProgress, { passive: true });

// ── NAV SCROLL
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
}, { passive: true });

// ── HAMBURGER / DRAWER
const hbg = document.getElementById('hamburger');
const drawer = document.getElementById('drawer');
hbg.addEventListener('click', () => {
  hbg.classList.toggle('active');
  drawer.classList.toggle('open');
  document.body.style.overflow = drawer.classList.contains('open') ? 'hidden' : '';
});
drawer.addEventListener('click', e => {
  if (e.target === drawer) { hbg.classList.remove('active'); drawer.classList.remove('open'); document.body.style.overflow = ''; }
});
document.querySelectorAll('.drawer-link,.drawer-cta').forEach(el => {
  el.addEventListener('click', () => { hbg.classList.remove('active'); drawer.classList.remove('open'); document.body.style.overflow = ''; });
});

// ── REVEAL ON SCROLL
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('up'); revealObs.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => revealObs.observe(el));

// ── TIMELINE FILL
const tlFill = document.getElementById('tlFill');
const tlSection = document.getElementById('how');
const tlObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) tlFill.classList.add('active'); });
}, { threshold: 0.2 });
tlObs.observe(tlSection);



// ── SERVICES SCROLL DOTS
const svcScroll = document.getElementById('svcScroll');
const dots = document.querySelectorAll('#svcDots .dot');
const cards = svcScroll.querySelectorAll('.svc-card');
function updateDots() {
  const cardW = cards[0].offsetWidth + 14;
  const idx = Math.round(svcScroll.scrollLeft / cardW);
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  // active card highlight
  cards.forEach((c, i) => c.classList.toggle('active-card', i === idx));
}
svcScroll.addEventListener('scroll', updateDots, { passive: true });
updateDots();

// ── STICKY BAR
const stickyBar = document.getElementById('stickyBar');
const heroSection = document.getElementById('hero');
const stickyObs = new IntersectionObserver(entries => {
  entries.forEach(e => stickyBar.classList.toggle('visible', !e.isIntersecting));
}, { threshold: 0 });
stickyObs.observe(heroSection);

// ── SMOOTH SCROLL
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// ── SPLIDE CAROUSEL INITIALIZATION ──
function initSplide() {
  var el = document.getElementById('choices-splide');
  if (el && !el.classList.contains('is-initialized')) {
    try {
      new Splide(el, {
        type: 'slide',
        perPage: 2,
        gap: '1.5rem',
        pagination: true,
        arrows: true,
        breakpoints: {
          768: {
            perPage: 1,
          }
        }
      }).mount();
    } catch (e) {
      console.error('Splide init failed:', e);
    }
  }
}
document.addEventListener('DOMContentLoaded', initSplide);
window.addEventListener('load', initSplide);
initSplide();

// =========================================
// CUSTOMER REVIEWS
// =========================================
const REVIEWS_AUTOPLAY_INTERVAL = 2000;
let reviewsSplideInstance = null;
let isFetchingReviews = false;

function formatReviewDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(d);
  } catch (e) {
    return '';
  }
}

function createReviewCard(item) {
  // Validate and clamp rating strictly between 1 and 5
  const rawRating = Number(item.rating);
  const rating = Number.isFinite(rawRating) ? Math.max(1, Math.min(5, Math.round(rawRating))) : 5;

  const slide = document.createElement('li');
  slide.className = 'splide__slide';

  const card = document.createElement('div');
  card.className = 'review-card';

  // Card Header: Stars & decorative quote mark
  const header = document.createElement('div');
  header.className = 'review-card-header';

  const starsDiv = document.createElement('div');
  starsDiv.className = 'review-stars';
  starsDiv.setAttribute('aria-label', `${rating} out of 5 stars`);

  for (let i = 1; i <= 5; i++) {
    const starSpan = document.createElement('span');
    starSpan.setAttribute('aria-hidden', 'true');
    if (i <= rating) {
      starSpan.className = 'star star-filled';
      starSpan.textContent = '★';
    } else {
      starSpan.className = 'star star-empty';
      starSpan.textContent = '☆';
    }
    starsDiv.appendChild(starSpan);
  }

  const quoteDecoration = document.createElement('div');
  quoteDecoration.className = 'review-quote-decoration';
  quoteDecoration.setAttribute('aria-hidden', 'true');
  quoteDecoration.textContent = '“';

  header.appendChild(starsDiv);
  header.appendChild(quoteDecoration);

  // Card Body: Untrusted feedback rendered safely via textContent to prevent XSS
  const blockquote = document.createElement('blockquote');
  blockquote.className = 'review-quote';

  const feedbackP = document.createElement('p');
  feedbackP.className = 'review-feedback';
  feedbackP.textContent = typeof item.feedback === 'string' ? item.feedback : '';
  blockquote.appendChild(feedbackP);

  // Card Meta: Subtle Customer Review label & Human-readable Date
  const meta = document.createElement('div');
  meta.className = 'review-meta';

  const authorSpan = document.createElement('span');
  authorSpan.className = 'review-author';
  // Display customer's submitted name if provided, or default to neutral indicator
  authorSpan.textContent = item.name || item.author_name || 'Customer Review';

  const dateSpan = document.createElement('span');
  dateSpan.className = 'review-date';
  dateSpan.textContent = formatReviewDate(item.created_at);

  meta.appendChild(authorSpan);
  meta.appendChild(dateSpan);

  card.appendChild(header);
  card.appendChild(blockquote);
  card.appendChild(meta);
  slide.appendChild(card);

  return slide;
}

function getRandomReviews(reviews, maxCount = 5) {
  if (!Array.isArray(reviews)) return [];
  if (reviews.length <= maxCount) return [...reviews];

  // Fisher-Yates shuffle on a shallow copy to ensure unbiased, duplicate-free selection
  const pool = [...reviews];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = pool[i];
    pool[i] = pool[j];
    pool[j] = temp;
  }
  return pool.slice(0, maxCount);
}

async function loadReviews() {
  if (isFetchingReviews) return;
  isFetchingReviews = true;

  const splideEl = document.getElementById('reviews-splide');
  const listEl = document.getElementById('reviews-list');
  const emptyEl = document.getElementById('reviews-empty');
  const errorEl = document.getElementById('reviews-error');
  const loadingEl = document.getElementById('reviews-loading');

  if (!splideEl || !listEl) {
    isFetchingReviews = false;
    return;
  }

  function showState(target) {
    if (loadingEl) loadingEl.style.display = 'none';
    if (splideEl) splideEl.style.display = target === 'splide' ? 'block' : 'none';
    if (emptyEl) emptyEl.style.display = target === 'empty' ? 'block' : 'none';
    if (errorEl) errorEl.style.display = target === 'error' ? 'block' : 'none';
  }

  try {
    const response = await fetch('/api/reviews');
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      if (reviewsSplideInstance) {
        try { reviewsSplideInstance.destroy(true); } catch (e) { }
        reviewsSplideInstance = null;
      }
      listEl.innerHTML = '';
      showState('empty');
      return;
    }

    // Filter valid approved reviews strictly with rating >= 4 and non-empty feedback
    const eligibleReviews = data.filter(item => {
      const r = Number(item && item.rating);
      return item &&
        Number.isInteger(r) &&
        r >= 4 &&
        r <= 5 &&
        typeof item.feedback === 'string' &&
        item.feedback.trim().length > 0;
    });

    if (eligibleReviews.length === 0) {
      if (reviewsSplideInstance) {
        try { reviewsSplideInstance.destroy(true); } catch (e) { }
        reviewsSplideInstance = null;
      }
      listEl.innerHTML = '';
      showState('empty');
      return;
    }

    // Randomly select up to 5 unique eligible reviews without duplicates
    const selectedReviews = getRandomReviews(eligibleReviews, 5);

    // Destroy previous Splide instance before re-populating slides to avoid stale state or duplicates
    if (reviewsSplideInstance) {
      try {
        reviewsSplideInstance.destroy(true);
      } catch (e) {
        console.warn('Splide destroy warning:', e);
      }
      reviewsSplideInstance = null;
    }

    // Populate reviews into splide list safely using safe DOM APIs (prevents XSS)
    listEl.innerHTML = '';
    selectedReviews.forEach(item => {
      const slide = createReviewCard(item);
      listEl.appendChild(slide);
    });

    showState('splide');

    // Mount Splide instance only after slides are in the DOM and container is visible
    if (typeof Splide !== 'undefined') {
      const count = selectedReviews.length;
      const isLoopable = count >= 3;
      try {
        reviewsSplideInstance = new Splide(splideEl, {
          type: isLoopable ? 'loop' : 'slide',
          autoplay: isLoopable,
          interval: REVIEWS_AUTOPLAY_INTERVAL,
          pauseOnHover: true,
          pauseOnFocus: true,
          resetProgress: false,
          perPage: Math.min(3, count),
          perMove: 1,
          gap: '1.5rem',
          pagination: count > 1,
          arrows: false,
          drag: count > 1,
          keyboard: 'focused',
          rewind: false,
          trimSpace: true,
          breakpoints: {
            1024: {
              perPage: Math.min(2, count),
              gap: '1.25rem',
              arrows: false,
            },
            768: {
              perPage: 1,
              gap: '1rem',
              arrows: false,
            }
          }
        });

        reviewsSplideInstance.mount();
      } catch (splideErr) {
        console.error('Reviews Splide initialization failed:', splideErr);
      }
    }
  } catch (err) {
    console.error('Failed to load customer reviews:', err);
    if (reviewsSplideInstance) {
      try { reviewsSplideInstance.destroy(true); } catch (e) { }
      reviewsSplideInstance = null;
    }
    showState('error');
  } finally {
    isFetchingReviews = false;
  }
}

// Expose globally for testing, submissions, and backwards compatibility
window.loadReviews = loadReviews;
window.loadCustomerReviews = loadReviews;

document.addEventListener('DOMContentLoaded', loadReviews);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  loadReviews();
}

// ==========================================
// CUSTOMER REVIEW SUBMISSION
// ==========================================
(function initReviewSubmission() {
  const modal = document.getElementById('reviewModal');
  const backdrop = document.getElementById('reviewModalBackdrop');
  const closeBtn = document.getElementById('closeReviewModalBtn');
  const cancelBtn = document.getElementById('cancelReviewModalBtn');
  const openBtns = document.querySelectorAll('.open-review-modal-btn');
  const form = document.getElementById('reviewForm');
  const formContainer = document.getElementById('reviewFormContainer');
  const successContainer = document.getElementById('reviewSuccessContainer');
  const closeSuccessBtn = document.getElementById('closeSuccessModalBtn');
  const starBtns = document.querySelectorAll('#starRatingSelect .star-btn');
  const ratingInput = document.getElementById('selectedRatingInput');
  const ratingStatusText = document.getElementById('ratingStatusText');
  const feedbackInput = document.getElementById('reviewFeedbackInput');
  const charCount = document.getElementById('feedbackCharCount');
  const nameInput = document.getElementById('reviewNameInput');
  const honeypotInput = document.getElementById('reviewWebsite');
  const alertBox = document.getElementById('reviewFormAlert');
  const submitBtn = document.getElementById('submitReviewBtn');
  const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
  const btnSpinner = submitBtn ? submitBtn.querySelector('.btn-spinner') : null;

  if (!modal || !form) return;

  let lastActiveElement = null;
  let selectedRating = 0;
  let isSubmitting = false;

  const ratingDescriptions = {
    1: '1 star — Needs improvement',
    2: '2 stars — Fair experience',
    3: '3 stars — Good service',
    4: '4 stars — Very good & caring',
    5: '5 stars — Exceptional care'
  };

  // ── RATING INTERACTION ──
  function updateStarVisuals(hoverIndex) {
    const activeLevel = hoverIndex || selectedRating;
    starBtns.forEach((btn) => {
      const starVal = Number(btn.getAttribute('data-rating'));
      if (starVal <= activeLevel) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
      btn.setAttribute('aria-checked', starVal === selectedRating ? 'true' : 'false');
    });

    if (activeLevel > 0 && ratingDescriptions[activeLevel]) {
      ratingStatusText.textContent = ratingDescriptions[activeLevel];
    } else {
      ratingStatusText.textContent = 'Select your rating';
    }
  }

  starBtns.forEach((btn) => {
    const val = Number(btn.getAttribute('data-rating'));

    btn.addEventListener('mouseenter', () => updateStarVisuals(val));
    btn.addEventListener('focus', () => updateStarVisuals(val));

    btn.addEventListener('click', () => {
      selectedRating = val;
      ratingInput.value = String(val);
      updateStarVisuals();
      hideAlert();
    });

    // Arrow navigation support between stars
    btn.addEventListener('keydown', (e) => {
      let nextStar = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextStar = document.querySelector(`.star-btn[data-rating="${Math.min(5, val + 1)}"]`);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextStar = document.querySelector(`.star-btn[data-rating="${Math.max(1, val - 1)}"]`);
      }

      if (nextStar) {
        nextStar.focus();
        nextStar.click();
      }
    });
  });

  const starGroup = document.getElementById('starRatingSelect');
  if (starGroup) {
    starGroup.addEventListener('mouseleave', () => updateStarVisuals());
  }

  // ── CHARACTER COUNT ──
  if (feedbackInput && charCount) {
    feedbackInput.addEventListener('input', () => {
      const len = feedbackInput.value.length;
      charCount.textContent = `${len} / 1000 characters (min 10)`;
      charCount.classList.toggle('limit-reached', len > 1000 || (len > 0 && len < 10));
    });
  }

  // ── ALERTS ──
  function showAlert(msg, isError = true) {
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = `form-alert ${isError ? 'is-error' : 'is-success'}`;
    alertBox.style.display = 'block';
    try {
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) { }
  }

  function hideAlert() {
    if (!alertBox) return;
    alertBox.style.display = 'none';
    alertBox.textContent = '';
  }

  // ── MODAL OPEN / CLOSE ──
  function openModal() {
    lastActiveElement = document.activeElement;
    modal.removeAttribute('hidden');
    document.body.classList.add('modal-open');
    resetForm();

    // Trap focus inside modal
    setTimeout(() => {
      const firstFocusable = modal.querySelector('button, [tabindex="0"]');
      if (firstFocusable) firstFocusable.focus();
    }, 50);

    document.addEventListener('keydown', handleKeydown);
  }

  function closeModal() {
    if (isSubmitting) return; // Prevent closing mid-flight
    modal.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', handleKeydown);

    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }

    if (e.key === 'Tab') {
      const focusable = modal.querySelectorAll(
        'button:not([disabled]), [tabindex="0"], textarea:not([disabled]), input:not([disabled]):not([type="hidden"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function resetForm() {
    form.reset();
    selectedRating = 0;
    ratingInput.value = '';
    updateStarVisuals();
    hideAlert();
    if (charCount) charCount.textContent = '0 / 1000 characters (min 10)';
    if (formContainer) formContainer.style.display = 'block';
    if (successContainer) successContainer.style.display = 'none';
    setSubmittingState(false);
  }

  function setSubmittingState(submitting) {
    isSubmitting = submitting;
    if (submitBtn) {
      submitBtn.disabled = submitting;
      if (btnText) btnText.textContent = submitting ? 'Submitting...' : 'Submit Review';
      if (btnSpinner) btnSpinner.style.display = submitting ? 'inline-block' : 'none';
    }
    if (cancelBtn) cancelBtn.disabled = submitting;
    if (closeBtn) closeBtn.disabled = submitting;
    starBtns.forEach(btn => btn.disabled = submitting);
    if (feedbackInput) feedbackInput.disabled = submitting;
    if (nameInput) nameInput.disabled = submitting;
  }

  // Event Listeners for Open / Close
  openBtns.forEach((btn) => btn.addEventListener('click', openModal));
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', closeModal);

  // ── FORM SUBMISSION ──
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    hideAlert();

    // 1. Frontend validation: Rating
    if (!selectedRating || selectedRating < 1 || selectedRating > 5) {
      showAlert('Please select a star rating (1 to 5 stars).', true);
      const firstStar = document.querySelector('#starRatingSelect .star-btn');
      if (firstStar) firstStar.focus();
      return;
    }

    // 2. Frontend validation: Feedback length
    const rawFeedback = feedbackInput.value || '';
    const trimmedFeedback = rawFeedback.trim();

    if (trimmedFeedback.length < 10) {
      showAlert('Please provide at least 10 characters describing your experience.', true);
      feedbackInput.focus();
      return;
    }

    if (trimmedFeedback.length > 1000) {
      showAlert('Feedback cannot exceed 1000 characters.', true);
      feedbackInput.focus();
      return;
    }

    // 3. Build payload
    const payload = {
      rating: selectedRating,
      feedback: trimmedFeedback,
      name: nameInput ? nameInput.value.trim() : '',
      website: honeypotInput ? honeypotInput.value : ''
    };

    setSubmittingState(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmittingState(false);

        // Show success state inside modal
        if (formContainer) formContainer.style.display = 'none';
        if (successContainer) successContainer.style.display = 'block';
        if (closeSuccessBtn) closeSuccessBtn.focus();

        // Refresh reviews carousel after successful submission
        if (typeof loadReviews === 'function') {
          loadReviews();
        }
      } else {
        const errorMsg = data.error || 'We could not submit your review. Please try again shortly.';
        showAlert(errorMsg, true);
        setSubmittingState(false);
      }
    } catch (err) {
      showAlert('Network error: please check your connection and try again.', true);
      setSubmittingState(false);
    }
  });
})();


