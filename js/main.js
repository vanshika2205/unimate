/* ==========================================================================
   UNIMATE - Full-Stack Client-Side Controller
   Connects UI to Express REST API & Database
   ========================================================================== */

const API_BASE = (window.location.origin && window.location.origin.startsWith('http')) 
  ? '/api' 
  : 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initAccordions();
  initFilterTabs();
  initModals();
  initFullStackForms();
  initPageSpecificModules();
});

/* --------------------------------------------------------------------------
   Navigation & Mobile Menu
   -------------------------------------------------------------------------- */
function initNavbar() {
  const header = document.querySelector('.site-header');
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const isOpen = navMenu.classList.contains('open');
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggleBtn.innerHTML = isOpen ? '&times;' : '&#9776;';
    });

    document.addEventListener('click', (e) => {
      if (header && !header.contains(e.target) && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        toggleBtn.innerHTML = '&#9776;';
      }
    });
  }
}

/* --------------------------------------------------------------------------
   Accordions
   -------------------------------------------------------------------------- */
function initAccordions() {
  const headers = document.querySelectorAll('.accordion-header');
  headers.forEach((header) => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      if (!item) return;
      const wasOpen = item.classList.contains('open');
      
      const parent = item.closest('.accordion');
      if (parent) {
        parent.querySelectorAll('.accordion-item').forEach((sibling) => {
          sibling.classList.remove('open');
        });
      }

      if (!wasOpen) {
        item.classList.add('open');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   Filter Tabs
   -------------------------------------------------------------------------- */
function initFilterTabs() {
  const filterContainers = document.querySelectorAll('[data-filter-group]');
  filterContainers.forEach((container) => {
    const buttons = container.querySelectorAll('.filter-btn');
    const targetSelector = container.getAttribute('data-filter-target');
    const items = document.querySelectorAll(targetSelector);

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');
        items.forEach((item) => {
          const category = item.getAttribute('data-category');
          if (filterValue === 'all' || category === filterValue || category?.includes(filterValue)) {
            item.style.display = '';
            item.style.animation = 'fadeIn 0.3s ease';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  });
}

/* --------------------------------------------------------------------------
   Modals
   -------------------------------------------------------------------------- */
function initModals() {
  const triggers = document.querySelectorAll('[data-open-modal]');
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = trigger.getAttribute('data-open-modal');
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('active');
      }
    });
  });

  const closers = document.querySelectorAll('[data-close-modal], .modal-close');
  closers.forEach((closer) => {
    closer.addEventListener('click', () => {
      const modal = closer.closest('.modal-overlay');
      if (modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Close when clicking background
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   Toast Notifications
   -------------------------------------------------------------------------- */
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bg = type === 'error' ? '#ef4444' : type === 'info' ? '#0284c7' : '#059669';
  toast.style.cssText = `
    background: ${bg};
    color: #ffffff;
    padding: 14px 20px;
    border-radius: 10px;
    font-size: 0.92rem;
    font-weight: 500;
    box-shadow: 0 10px 30px rgba(0,0,0,0.25);
    display: flex;
    align-items: center;
    gap: 10px;
    opacity: 0;
    transform: translateY(15px);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: auto;
    max-width: 380px;
  `;
  
  const icon = type === 'error' ? '⚠️' : type === 'info' ? 'ℹ️' : '✓';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

/* --------------------------------------------------------------------------
   Full-Stack Form Submissions (Real Backend APIs)
   -------------------------------------------------------------------------- */
function initFullStackForms() {
  const forms = document.querySelectorAll('form[data-ajax-form]');
  
  forms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Submit';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg style="animation: spin 0.8s linear infinite; display:inline-block; vertical-align:middle; margin-right:6px;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10"></path>
          </svg> Processing...
        `;
      }

      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Determine endpoint based on page or data attributes
        let endpoint = form.getAttribute('data-endpoint');
        const page = window.location.pathname.toLowerCase();

        if (!endpoint) {
          if (page.includes('internship')) {
            endpoint = `${API_BASE}/applications`;
            // map form inputs
            data.fullName = data.fullName || form.querySelector('input[type="text"]')?.value;
            data.email = data.email || form.querySelector('input[type="email"]')?.value;
            data.roleTitle = data.roleTitle || form.querySelector('select')?.selectedOptions[0]?.text;
            data.sop = data.sop || form.querySelector('textarea')?.value;
            data.university = data.university || form.querySelectorAll('input[type="text"]')[1]?.value || 'Engineering College';
            data.branch = data.branch || 'Undergraduate';
          } else if (page.includes('academic')) {
            endpoint = `${API_BASE}/notes`;
            data.title = data.title || form.querySelector('input[type="text"]')?.value;
            data.subject = data.subject || 'Engineering Subject';
            data.branch = data.branch || 'Common Engineering';
          } else if (page.includes('community')) {
            endpoint = `${API_BASE}/community/posts`;
          } else if (page.includes('mentorship') || page.includes('training')) {
            endpoint = `${API_BASE}/mentorship/book`;
            data.studentName = data.studentName || form.querySelector('input[type="text"]')?.value;
            data.studentEmail = data.studentEmail || form.querySelector('input[type="email"]')?.value;
            data.domain = data.domain || form.querySelector('select')?.value || 'Tech Mentorship';
          } else if (page.includes('project')) {
            endpoint = `${API_BASE}/projects/proj-1/join`;
            data.name = data.name || form.querySelector('input[type="text"]')?.value;
            data.email = data.email || form.querySelector('input[type="email"]')?.value;
          } else {
            endpoint = `${API_BASE}/contact`;
            data.name = data.name || form.querySelector('input[type="text"]')?.value;
            data.email = data.email || form.querySelector('input[type="email"]')?.value;
            data.message = data.message || form.querySelector('textarea')?.value;
          }
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await res.json();

        if (res.ok && result.success) {
          let msg = result.message || 'Submitted successfully!';
          if (result.trackingId) {
            msg = `🎉 Application received! Tracking ID: <strong>${result.trackingId}</strong>`;
          }
          showToast(msg, 'success');
          form.reset();

          // Close active modal
          const parentModal = form.closest('.modal-overlay');
          if (parentModal) {
            parentModal.classList.remove('active');
          }

          // Trigger refresh on relevant catalogs
          if (window.refreshAcademicNotes) window.refreshAcademicNotes();
          if (window.refreshCommunityPosts) window.refreshCommunityPosts();
        } else {
          showToast(result.error || 'Submission failed. Please check inputs.', 'error');
        }
      } catch (err) {
        console.error('Submission error:', err);
        showToast('Network error: Unable to connect to server.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
        }
      }
    });
  });
}

/* --------------------------------------------------------------------------
   Page Specific Modules
   -------------------------------------------------------------------------- */
function initPageSpecificModules() {
  const path = window.location.pathname.toLowerCase();

  if (path.includes('internship')) {
    initInternshipTrackingWidget();
  } else if (path.includes('academic')) {
    initAcademicNotesCatalog();
  } else if (path.includes('community')) {
    initCommunityFeed();
  } else if (path.includes('project')) {
    initProjectCards();
  }
}

/* --- Internship Live Tracker Widget --- */
function initInternshipTrackingWidget() {
  const formCard = document.querySelector('.internships-form-section .form-card') || document.querySelector('.form-card');
  if (!formCard) return;

  const trackerBox = document.createElement('div');
  trackerBox.style.cssText = `
    background: #0f1c32;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 32px;
    color: #ffffff;
  `;
  trackerBox.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
      <span style="font-size:1.2rem;">🔍</span>
      <h4 style="margin:0; font-size:1.05rem; font-weight:700;">Track Your Application</h4>
    </div>
    <p style="font-size:0.86rem; color:#94a3b8; margin-bottom:16px;">
      Enter your Tracking ID (e.g. <code>APP-1021</code>) or email to check real-time review status.
    </p>
    <div style="display:flex; gap:8px;">
      <input type="text" id="trackAppInput" placeholder="Enter APP-ID or Email" class="form-control" style="background:#071224; border-color:#2a3a55; color:#fff; font-size:0.9rem;">
      <button type="button" id="trackAppBtn" class="btn btn-primary btn-sm" style="white-space:nowrap;">Track Status</button>
    </div>
    <div id="trackAppResult" style="margin-top:16px; display:none;"></div>
  `;

  formCard.parentNode.insertBefore(trackerBox, formCard);

  const trackBtn = document.getElementById('trackAppBtn');
  const trackInput = document.getElementById('trackAppInput');
  const trackResult = document.getElementById('trackAppResult');

  const doTrack = async () => {
    const q = trackInput.value.trim();
    if (!q) {
      showToast('Please enter your Tracking ID or Email', 'info');
      return;
    }

    trackBtn.disabled = true;
    trackBtn.innerText = 'Searching...';

    try {
      const res = await fetch(`${API_BASE}/applications/track/${encodeURIComponent(q)}`);
      const data = await res.json();

      trackResult.style.display = 'block';
      if (res.ok && data.success) {
        const app = data.application;
        const statusColors = {
          under_review: { bg: '#e0f2fe', text: '#0369a1', label: 'Under Review' },
          accepted: { bg: '#dcfce7', text: '#15803d', label: 'Accepted / Interview Ready' },
          pending: { bg: '#fef3c7', text: '#b45309', label: 'Received' },
          rejected: { bg: '#fee2e2', text: '#b91c1c', label: 'Not Selected' }
        };
        const st = statusColors[app.status] || { bg: '#f1f5f9', text: '#475569', label: app.status };

        trackResult.innerHTML = `
          <div style="background:#13233f; border:1px solid #23385d; border-radius:12px; padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:0.8rem; color:#60a5fa; font-weight:700;">${app.id}</span>
              <span style="background:${st.bg}; color:${st.text}; padding:4px 10px; border-radius:20px; font-size:0.75rem; font-weight:700; text-transform:uppercase;">${st.label}</span>
            </div>
            <h5 style="margin:0 0 4px; font-size:0.95rem; color:#fff;">${app.fullName}</h5>
            <p style="margin:0 0 8px; font-size:0.82rem; color:#94a3b8;">${app.roleTitle} • ${app.university}</p>
            <div style="font-size:0.78rem; color:#64748b;">Submitted: ${new Date(app.submittedAt).toLocaleDateString()}</div>
          </div>
        `;
      } else {
        trackResult.innerHTML = `
          <div style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); border-radius:10px; padding:12px; color:#fca5a5; font-size:0.85rem;">
            ${data.error || 'No matching application found.'}
          </div>
        `;
      }
    } catch (err) {
      console.error(err);
      trackResult.style.display = 'block';
      trackResult.innerHTML = `<div style="color:#fca5a5; font-size:0.85rem;">Server connection error.</div>`;
    } finally {
      trackBtn.disabled = false;
      trackBtn.innerText = 'Track Status';
    }
  };

  trackBtn.addEventListener('click', doTrack);
  trackInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') doTrack();
  });
}

/* --- Dynamic Academic Support Notes Catalog --- */
function initAcademicNotesCatalog() {
  const grid = document.getElementById('resourceCatalogGrid');
  const searchInput = document.getElementById('resourceSearchInput');
  const branchSelect = document.getElementById('resourceBranchSelect');
  const searchBtn = document.getElementById('filterResourcesBtn');

  if (!grid) return;

  const loadNotes = async () => {
    const q = searchInput ? searchInput.value.trim() : '';
    const branch = branchSelect ? branchSelect.value : 'all';

    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 40px; color:#64748b;">
        <svg style="animation: spin 1s linear infinite;" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.2"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        <p style="margin-top:12px;">Loading verified notes & question banks...</p>
      </div>
    `;

    try {
      const url = new URL(`${API_BASE}/notes`, window.location.origin);
      if (q) url.searchParams.set('search', q);
      if (branch && branch !== 'all') url.searchParams.set('branch', branch);

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.notes && data.notes.length > 0) {
        grid.innerHTML = data.notes.map((note) => `
          <div class="path-card resource-card" style="display:flex; flex-direction:column; justify-content:space-between;">
            <div class="path-card-body">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span class="badge badge-blue">${note.type || 'Notes'} • Sem ${note.semester || 1}</span>
                <span style="font-size:0.75rem; color:#64748b; font-weight:600;">📥 <span id="dl-${note.id}">${note.downloads || 0}</span></span>
              </div>
              <h3 class="path-card-title" style="font-size:1.15rem; margin-bottom:8px;">${note.title}</h3>
              <p class="path-card-techs" style="margin-bottom:14px; color:#475569; font-size:0.88rem;">
                <strong>${note.subject}</strong> • ${note.branch}
              </p>
              <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:18px;">
                ${(note.tags || []).map(t => `<span class="badge badge-neutral" style="font-size:0.72rem;">#${t}</span>`).join('')}
              </div>
            </div>
            <div style="padding-top:14px; border-top:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.78rem; color:#94a3b8;">${note.fileSize || '3.2 MB'} • Verified</span>
              <button class="btn btn-outline btn-sm download-note-btn" data-id="${note.id}" data-title="${note.title}">
                Download &darr;
              </button>
            </div>
          </div>
        `).join('');

        // Wire download triggers
        grid.querySelectorAll('.download-note-btn').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const title = btn.getAttribute('data-title');
            showToast(`Starting download: "${title}"`, 'info');

            try {
              const dlRes = await fetch(`${API_BASE}/notes/${id}/download`, { method: 'POST' });
              const dlData = await dlRes.json();
              if (dlData.success) {
                const countEl = document.getElementById(`dl-${id}`);
                if (countEl) countEl.innerText = dlData.downloads;
              }
            } catch (err) {
              console.error(err);
            }
          });
        });
      } else {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align:center; padding: 60px 20px; background:#f8fafc; border-radius:16px; border:2px dashed #cbd5e1;">
            <p style="font-size:1.2rem; font-weight:600; color:#1e293b; margin-bottom:6px;">No study resources found</p>
            <p style="color:#64748b; font-size:0.9rem; margin-bottom:18px;">Try searching with different terms or contribute notes to help your peers.</p>
            <button class="btn btn-primary btn-sm" onclick="document.getElementById('contributeModal')?.classList.add('active')">
              + Contribute First Note
            </button>
          </div>
        `;
      }
    } catch (err) {
      console.error(err);
      grid.innerHTML = `<div style="grid-column:1/-1; color:#ef4444; padding:20px;">Failed to load resources from server.</div>`;
    }
  };

  window.refreshAcademicNotes = loadNotes;
  if (searchBtn) searchBtn.addEventListener('click', loadNotes);
  if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') loadNotes(); });
  if (branchSelect) branchSelect.addEventListener('change', loadNotes);

  loadNotes();
}

/* --- Live Community Feed on community.html --- */
function initCommunityFeed() {
  const container = document.getElementById('liveCommunityFeed');
  if (!container) return;

  const loadFeed = async () => {
    try {
      const res = await fetch(`${API_BASE}/community/posts`);
      const data = await res.json();

      if (res.ok && data.posts) {
        container.innerHTML = data.posts.map((post) => `
          <div class="community-thread-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; padding:24px; margin-bottom:20px; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:42px; height:42px; border-radius:50%; background:${post.avatarColor || '#1d68f5'}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.05rem;">
                  ${post.authorName ? post.authorName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 style="margin:0; font-size:1rem; font-weight:700; color:#0f172a;">${post.authorName}</h4>
                  <span style="font-size:0.8rem; color:#64748b;">${post.authorRole} • ${new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <span class="badge badge-blue">#${post.channel || 'general'}</span>
            </div>

            <h3 style="font-size:1.15rem; font-weight:700; color:#0a0f1d; margin-bottom:10px;">${post.title}</h3>
            <p style="color:#334155; line-height:1.6; font-size:0.95rem; margin-bottom:16px;">${post.content}</p>

            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:18px;">
              ${(post.tags || []).map(t => `<span class="badge badge-neutral" style="font-size:0.75rem;">#${t}</span>`).join('')}
            </div>

            <div style="display:flex; gap:16px; align-items:center; border-top:1px solid #f1f5f9; padding-top:14px;">
              <button class="btn btn-outline btn-sm like-post-btn" data-id="${post.id}" style="padding:6px 14px; font-size:0.85rem;">
                ❤️ Helpful (<span id="likes-${post.id}">${post.likes || 0}</span>)
              </button>
              <span style="font-size:0.85rem; color:#64748b;">💬 ${(post.replies || []).length} replies</span>
            </div>

            <!-- Replies List -->
            ${(post.replies && post.replies.length > 0) ? `
              <div style="margin-top:16px; padding-left:16px; border-left:3px solid #e2e8f0; display:flex; flex-direction:column; gap:10px;">
                ${post.replies.map(r => `
                  <div style="background:#f8fafc; padding:10px 14px; border-radius:10px; font-size:0.88rem;">
                    <strong>${r.authorName}</strong> <span style="font-size:0.75rem; color:#94a3b8;">(${r.authorRole || 'Student'})</span>:
                    <div style="color:#334155; margin-top:4px;">${r.content}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- Reply Box -->
            <div style="margin-top:16px; display:flex; gap:8px;">
              <input type="text" class="form-control reply-input" data-id="${post.id}" placeholder="Write a supportive reply or answer..." style="font-size:0.88rem;">
              <button class="btn btn-primary btn-sm send-reply-btn" data-id="${post.id}">Reply</button>
            </div>
          </div>
        `).join('');

        // Wire likes
        container.querySelectorAll('.like-post-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const res = await fetch(`${API_BASE}/community/posts/${id}/like`, { method: 'POST' });
            const d = await res.json();
            if (d.success) {
              document.getElementById(`likes-${id}`).innerText = d.likes;
            }
          });
        });

        // Wire replies
        container.querySelectorAll('.send-reply-btn').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const input = container.querySelector(`.reply-input[data-id="${id}"]`);
            const content = input?.value.trim();
            if (!content) return;

            btn.disabled = true;
            try {
              const res = await fetch(`${API_BASE}/community/posts/${id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authorName: 'Student Member', authorRole: 'Peer', content })
              });
              const d = await res.json();
              if (d.success) {
                showToast('Reply added!', 'success');
                loadFeed();
              }
            } catch (err) {
              console.error(err);
            } finally {
              btn.disabled = false;
            }
          });
        });
      }
    } catch (err) {
      console.error(err);
      container.innerHTML = `<div style="color:#ef4444;">Could not load community feed.</div>`;
    }
  };

  window.refreshCommunityPosts = loadFeed;
  loadFeed();
}

/* --- Project Cards Wire-up on projects.html --- */
function initProjectCards() {
  document.querySelectorAll('.apply-project-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = document.getElementById('teammateModal');
      if (modal) modal.classList.add('active');
    });
  });
}
