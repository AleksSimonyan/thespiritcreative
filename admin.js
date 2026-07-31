const ADMIN_SESSION_KEY = "theSpiritCreativeAdminUnlocked";
const ADMIN_TOKEN_KEY = "spiritAdminToken";

const loginForm = document.querySelector("#loginForm");
const passwordInput = document.querySelector("#passwordInput");
const loginStatus = document.querySelector("#loginStatus");
const lockScreen = document.querySelector("#lockScreen");
const adminApp = document.querySelector("#adminApp");
const workList = document.querySelector("#workList");
const workForm = document.querySelector("#workForm");
const editorTitle = document.querySelector("#editorTitle");
const saveStatus = document.querySelector("#saveStatus");
const newWorkButton = document.querySelector("#newWorkButton");
const deleteButton = document.querySelector("#deleteButton");
const exportButton = document.querySelector("#exportButton");
const importInput = document.querySelector("#importInput");
const logoutButton = document.querySelector("#logoutButton");
const galleryList = document.querySelector("#galleryList");
const galleryUrl = document.querySelector("#galleryUrl");
const galleryUpload = document.querySelector("#galleryUpload");
const addGalleryUrl = document.querySelector("#addGalleryUrl");
const heroList = document.querySelector("#heroList");
const heroUpload = document.querySelector("#heroUpload");
const worksCount = document.querySelector("#worksCount");
const inquiryBadge = document.querySelector("#inquiryBadge");
const inquiriesList = document.querySelector("#inquiriesList");
const inquiriesCount = document.querySelector("#inquiriesCount");
const markAllRead = document.querySelector("#markAllRead");
const panelTitle = document.querySelector("#panelTitle");
const tabButtons = [...document.querySelectorAll(".tab-btn")];
const worksPanel = document.querySelector("#worksPanel");
const inquiriesPanel = document.querySelector("#inquiriesPanel");

let works = [];
let activeId = null;
let activeGallery = [];
let activeHeroImages = [];
let dragId = null;
let dragReordered = false;

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const setStatus = (element, message, isError = false) => {
  element.textContent = message;
  element.classList.toggle("is-error", isError);
};

const showAdmin = async () => {
  setStatus(loginStatus, "");
  lockScreen.hidden = true;
  adminApp.hidden = false;
  await window.SpiritWorks.init({ includeInquiries: true, force: true });
  refreshAll();
};

const showLogin = () => {
  lockScreen.hidden = false;
  adminApp.hidden = true;
  passwordInput.focus();
};

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || `work-${Date.now()}`;

const uniqueId = (title, currentId = "") => {
  const base = slugify(title);
  let next = base;
  let count = 2;
  while (works.some((work) => work.id === next && work.id !== currentId)) {
    next = `${base}-${count}`;
    count += 1;
  }
  return next;
};

const authHeaders = () => {
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mapSequential = async (values, mapper) => {
  const results = [];
  for (let index = 0; index < values.length; index += 1) {
    try {
      results.push(await mapper(values[index], index));
    } catch (error) {
      throw new Error(`Photo ${index + 1}: ${error.message}`);
    }
    if (index < values.length - 1) await sleep(200);
  }
  return results;
};

const uploadBlob = async (blob, label = "image") => {
  const formData = new FormData();
  formData.append("file", blob, `${label}.jpg`);

  let lastError = "Image upload failed.";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) return data.url;
    lastError = data.error || lastError;
    if (attempt < 3) await sleep(400 * attempt);
  }
  throw new Error(lastError);
};

const uploadDataUrl = async (value) => {
  if (!value || !value.startsWith("data:image/")) return value;
  const response = await fetch(value);
  const blob = await response.blob();
  return uploadBlob(blob, "embedded");
};

const workHasEmbeddedImages = (work) => {
  const images = [work.cardImage, ...(work.heroImages || []), ...(work.gallery || [])];
  return images.some((img) => img?.startsWith("data:image/"));
};

const externalizeWork = async (work) => {
  const cardImage = await uploadDataUrl(work.cardImage);
  const heroImages = await mapSequential(work.heroImages || [], (img) => uploadDataUrl(img));
  const gallery = await mapSequential(work.gallery || [], (img) => uploadDataUrl(img));

  return {
    ...work,
    cardImage,
    heroImages,
    gallery,
    heroImage: heroImages[0] || cardImage || work.heroImage || "",
  };
};

const persistWorks = async () => {
  try {
    setStatus(saveStatus, "Saving...");
    const nextWorks = [];
    for (let index = 0; index < works.length; index += 1) {
      const ordered = { ...works[index], order: index };
      nextWorks.push(
        workHasEmbeddedImages(ordered) ? await externalizeWork(ordered) : ordered
      );
    }
    works = nextWorks;
    await window.SpiritWorks.saveWorks(works);
    await window.SpiritWorks.init({ includeInquiries: true, force: true });
    works = window.SpiritWorks.getWorks(true);
    if (activeId && !works.find((w) => w.id === activeId)) activeId = works[0]?.id || null;
    return true;
  } catch (error) {
    setStatus(
      saveStatus,
      error.message || "Could not save — check your connection and try again.",
      true
    );
    return false;
  }
};

const activeWork = () => works.find((work) => work.id === activeId) || null;

const updateBadges = () => {
  worksCount.textContent = works.length;
  const unread = window.SpiritWorks.getUnreadCount();
  inquiryBadge.textContent = unread;
  inquiryBadge.hidden = unread === 0;
  inquiriesCount.textContent = `${window.SpiritWorks.getInquiries().length} inquiries`;
};

const renderWorkList = () => {
  workList.innerHTML = works
    .map(
      (work, index) => `
        <div
          class="work-list-item ${work.id === activeId ? "is-active" : ""} ${work.visible ? "" : "is-hidden-work"}"
          draggable="true"
          data-id="${escapeHtml(work.id)}"
          data-index="${index}"
        >
          <img src="${escapeHtml(work.cardImage || work.gallery?.[0] || "")}" alt="" />
          <span>
            <strong>${escapeHtml(work.title)}</strong>
            <small>${work.visible ? escapeHtml(work.services || "No label") : "Hidden"}</small>
          </span>
          <div class="work-list-controls">
            <button type="button" data-move="up" data-id="${escapeHtml(work.id)}" title="Move up">↑</button>
            <button type="button" data-move="down" data-id="${escapeHtml(work.id)}" title="Move down">↓</button>
            <button type="button" data-toggle-visible="${escapeHtml(work.id)}" title="Toggle visibility">${work.visible ? "👁" : "○"}</button>
          </div>
        </div>
      `
    )
    .join("");
};

const renderPreview = (name) => {
  const input = workForm.elements[name];
  const preview = document.querySelector(`[data-preview="${name}"]`);
  const urlInput = document.querySelector(`[data-image-url-target="${name}"]`);
  if (!preview) return;

  preview.innerHTML = "";
  const value = input?.value || "";
  if (urlInput && !value.startsWith("data:")) {
    urlInput.value = value.startsWith("http") ? value : "";
  } else if (urlInput) {
    urlInput.value = "";
  }

  if (!value) return;

  const img = document.createElement("img");
  img.src = value;
  img.alt = "";
  preview.appendChild(img);
};

const setImageField = (name, value) => {
  workForm.elements[name].value = value;
  renderPreview(name);
};

const renderImageList = (container, images, kind) => {
  if (!container) return;
  container.innerHTML = "";

  images.forEach((image, index) => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.draggable = true;
    item.dataset.index = String(index);
    item.dataset.kind = kind;

    const img = document.createElement("img");
    img.alt = "";
    img.src = image;
    img.draggable = false;

    const sequence = document.createElement("span");
    sequence.className = "gallery-item-sequence";
    sequence.textContent = String(index + 1);

    const controls = document.createElement("div");
    controls.className = "gallery-item-controls";

    if (index > 0) {
      const upButton = document.createElement("button");
      upButton.type = "button";
      upButton.className = "gallery-move-btn";
      upButton.title = "Move earlier";
      upButton.textContent = "↑";
      upButton.setAttribute("data-move-image", "up");
      upButton.setAttribute("data-kind", kind);
      upButton.setAttribute("data-index", String(index));
      controls.appendChild(upButton);
    }

    if (index < images.length - 1) {
      const downButton = document.createElement("button");
      downButton.type = "button";
      downButton.className = "gallery-move-btn";
      downButton.title = "Move later";
      downButton.textContent = "↓";
      downButton.setAttribute("data-move-image", "down");
      downButton.setAttribute("data-kind", kind);
      downButton.setAttribute("data-index", String(index));
      controls.appendChild(downButton);
    }

    const removeButton = document.createElement("button");
    removeButton.className = "btn-secondary danger gallery-remove-btn";
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute(`data-remove-${kind}`, String(index));

    item.appendChild(sequence);
    item.appendChild(img);
    item.appendChild(controls);
    item.appendChild(removeButton);
    container.appendChild(item);
  });
};

const getImageListByKind = (kind) => (kind === "hero" ? activeHeroImages : activeGallery);

const moveImageInList = (kind, index, direction) => {
  const list = getImageListByKind(kind);
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
  if (kind === "hero") renderHeroList();
  else renderGallery();
  setStatus(saveStatus, "Photo order updated — save the project.");
};

let imageDragKind = null;
let imageDragIndex = null;

const updateGalleryCounts = () => {
  const heroHint = document.querySelector(".hero-editor .field-hint");
  const galleryHint = document.querySelector(".gallery-editor:not(.hero-editor) .field-hint");
  if (heroHint) {
    heroHint.textContent = `${activeHeroImages.length} hero slide${activeHeroImages.length === 1 ? "" : "s"} — drag or use arrows to reorder.`;
  }
  if (galleryHint) {
    galleryHint.textContent = `${activeGallery.length} project photo${activeGallery.length === 1 ? "" : "s"} — drag or use arrows to reorder.`;
  }
};

const renderGallery = () => {
  renderImageList(galleryList, activeGallery, "gallery");
  updateGalleryCounts();
};

const renderHeroList = () => {
  renderImageList(heroList, activeHeroImages, "hero");
  updateGalleryCounts();
};

const populateForm = (work) => {
  if (!work) {
    workForm.reset();
    editorTitle.textContent = "Select a project";
    activeGallery = [];
    activeHeroImages = [];
    renderGallery();
    renderHeroList();
    renderPreview("cardImage");
    deleteButton.disabled = true;
    return;
  }

  deleteButton.disabled = false;
  editorTitle.textContent = work.title;
  workForm.elements.title.value = work.title;
  workForm.elements.services.value = work.services;
  workForm.elements.subtitle.value = work.subtitle || "";
  workForm.elements.industry.value = work.industry;
  workForm.elements.client.value = work.client;
  workForm.elements.year.value = work.year;
  workForm.elements.cardAlt.value = work.cardAlt;
  workForm.elements.cardImage.value = work.cardImage;
  workForm.elements.brandStory.value = work.brandStory || "";
  workForm.elements.visible.checked = work.visible;
  workForm.querySelectorAll('input[name="categories"]').forEach((input) => {
    input.checked = work.categories.includes(input.value);
  });
  activeGallery = [...work.gallery];
  activeHeroImages = [...work.heroImages];
  renderPreview("cardImage");
  renderGallery();
  renderHeroList();
};

const selectWork = (id) => {
  activeId = id;
  renderWorkList();
  populateForm(activeWork());
  setStatus(saveStatus, "");
};

const readForm = () => {
  const title = workForm.elements.title.value.trim() || "Untitled Work";
  const current = activeWork();
  const id = current?.id || uniqueId(title);
  const categories = [...workForm.querySelectorAll('input[name="categories"]:checked')].map(
    (input) => input.value
  );

  return window.SpiritWorks.normalizeWork({
    id: uniqueId(title, id),
    title,
    services: workForm.elements.services.value.trim(),
    subtitle: workForm.elements.subtitle.value.trim(),
    categories,
    industry: workForm.elements.industry.value.trim(),
    client: workForm.elements.client.value.trim(),
    year: workForm.elements.year.value.trim(),
    cardAlt: workForm.elements.cardAlt.value.trim() || title,
    cardImage: workForm.elements.cardImage.value.trim(),
    brandStory: workForm.elements.brandStory.value.trim(),
    visible: workForm.elements.visible.checked,
    order: current?.order ?? works.length,
    heroImages: activeHeroImages,
    gallery: activeGallery,
  });
};

const saveActiveWork = async () => {
  const saved = readForm();
  const index = works.findIndex((work) => work.id === activeId);
  if (index >= 0) works[index] = saved;
  else works.unshift(saved);
  activeId = saved.id;

  if (await persistWorks()) {
    renderWorkList();
    populateForm(activeWork());
    updateBadges();
    setStatus(saveStatus, "Saved — changes are live on the website.");
  }
};

const moveWork = async (id, direction) => {
  const index = works.findIndex((w) => w.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= works.length) return;
  [works[index], works[target]] = [works[target], works[index]];
  if (await persistWorks()) {
    renderWorkList();
    setStatus(saveStatus, "Order updated.");
  }
};

const toggleVisibility = async (id) => {
  const work = works.find((w) => w.id === id);
  if (!work) return;
  work.visible = !work.visible;
  if (await persistWorks()) {
    renderWorkList();
    if (activeId === id) populateForm(work);
    setStatus(saveStatus, work.visible ? "Project is now visible." : "Project is now hidden.");
  }
};

const blankWork = () =>
  window.SpiritWorks.normalizeWork({
    id: uniqueId("New Project"),
    title: "New Project",
    services: "Branding / Packaging",
    subtitle: "Short description of the project.",
    categories: ["branding"],
    industry: "",
    client: "",
    year: new Date().getFullYear().toString(),
    cardAlt: "Project image",
    cardImage: "",
    brandStory: "",
    visible: true,
    order: 0,
    heroImages: [],
    gallery: [],
  });

const resizeImageToBlob = (file, aspectW, aspectH, maxWidth = 1200, quality = 0.82) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not load image."));
      image.onload = () => {
        const targetRatio = aspectW / aspectH;
        const sourceRatio = image.width / image.height;
        let sx;
        let sy;
        let sw;
        let sh;

        if (sourceRatio > targetRatio) {
          sh = image.height;
          sw = sh * targetRatio;
          sx = (image.width - sw) / 2;
          sy = 0;
        } else {
          sw = image.width;
          sh = sw / targetRatio;
          sx = 0;
          sy = (image.height - sh) / 2;
        }

        const scale = Math.min(1, maxWidth / sw);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(sw * scale);
        canvas.height = Math.round(sh * scale);
        canvas.getContext("2d").drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Could not compress image."))),
          "image/jpeg",
          quality
        );
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

const processImageUpload = async (file, target) => {
  if (target === "cardImage") return resizeImageToBlob(file, 3, 4, 900, 0.82);
  if (target === "hero") return resizeImageToBlob(file, 16, 9, 1400, 0.8);
  return resizeImageToBlob(file, 3, 4, 800, 0.76);
};

const uploadProcessedFiles = async (files, target, label) => {
  const urls = [];
  for (let index = 0; index < files.length; index += 1) {
    setStatus(saveStatus, `Uploading ${label} ${index + 1} of ${files.length}...`);
    const blob = await processImageUpload(files[index], target);
    urls.push(await uploadBlob(blob, `${target}-${index + 1}`));
  }
  return urls;
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const renderInquiries = () => {
  const inquiries = window.SpiritWorks.getInquiries();
  inquiriesCount.textContent = `${inquiries.length} inquiries`;

  if (!inquiries.length) {
    inquiriesList.innerHTML = `<p class="empty-state">No inquiries yet. Submissions from the website contact form will appear here.</p>`;
    return;
  }

  inquiriesList.innerHTML = inquiries
    .map(
      (inq) => `
        <article class="inquiry-card ${inq.read ? "" : "is-unread"}">
          <div class="inquiry-card-head">
            <h3>${escapeHtml(inq.fullName)}${inq.company ? ` · ${escapeHtml(inq.company)}` : ""}</h3>
            <span class="inquiry-date">${escapeHtml(formatDate(inq.createdAt))}</span>
          </div>
          <div class="inquiry-meta">
            <span>${escapeHtml(inq.email)}</span>
            <span>${escapeHtml(inq.phone)}</span>
            ${inq.projectType ? `<span>${escapeHtml(inq.projectType)}</span>` : ""}
            ${inq.budget ? `<span>Budget: ${escapeHtml(inq.budget)}</span>` : ""}
          </div>
          <p class="inquiry-message">${escapeHtml(inq.message)}</p>
          <div class="inquiry-actions">
            <button class="btn-secondary" type="button" data-mark-read="${escapeHtml(inq.id)}" data-read="${inq.read}">
              ${inq.read ? "Mark unread" : "Mark read"}
            </button>
            <a class="btn-secondary" href="mailto:${escapeHtml(inq.email)}">Reply</a>
            <button class="btn-secondary danger" type="button" data-delete-inquiry="${escapeHtml(inq.id)}">Delete</button>
          </div>
        </article>
      `
    )
    .join("");
};

const refreshAll = () => {
  works = window.SpiritWorks.getWorks(true);
  if (activeId && !works.find((w) => w.id === activeId)) activeId = works[0]?.id || null;
  renderWorkList();
  populateForm(activeWork());
  renderInquiries();
  updateBadges();
};

const switchPanel = (panel) => {
  tabButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.panel === panel));
  worksPanel.classList.toggle("is-active", panel === "works");
  inquiriesPanel.classList.toggle("is-active", panel === "inquiries");
  panelTitle.textContent = panel === "works" ? "Projects" : "Inquiries";
  if (panel === "inquiries") renderInquiries();
};

/* Events */
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passwordInput.value }),
    });
    if (!response.ok) throw new Error("Unauthorized");
    const { token } = await response.json();
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    await showAdmin();
  } catch {
    setStatus(loginStatus, "Wrong password.", true);
  }
});

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => switchPanel(btn.dataset.panel));
});

newWorkButton.addEventListener("click", async () => {
  const work = blankWork();
  works.unshift(work);
  activeId = work.id;
  if (await persistWorks()) {
    renderWorkList();
    populateForm(work);
    updateBadges();
    setStatus(saveStatus, "New project added.");
  }
});

workList.addEventListener("click", (event) => {
  const moveBtn = event.target.closest("[data-move]");
  if (moveBtn) {
    moveWork(moveBtn.dataset.id, moveBtn.dataset.move);
    return;
  }
  const toggleBtn = event.target.closest("[data-toggle-visible]");
  if (toggleBtn) {
    toggleVisibility(toggleBtn.dataset.toggleVisible);
    return;
  }
  const item = event.target.closest("[data-id]");
  if (item && !event.target.closest(".work-list-controls")) selectWork(item.dataset.id);
});

workList.addEventListener("dragstart", (event) => {
  const item = event.target.closest("[data-id]");
  if (!item) return;
  dragId = item.dataset.id;
  dragReordered = false;
  item.classList.add("is-dragging");
});

workList.addEventListener("dragend", async (event) => {
  event.target.closest("[data-id]")?.classList.remove("is-dragging");
  if (dragReordered && (await persistWorks())) {
    setStatus(saveStatus, "Order updated.");
  }
  dragId = null;
  dragReordered = false;
});

workList.addEventListener("dragover", (event) => {
  event.preventDefault();
  const target = event.target.closest("[data-id]");
  if (!target || !dragId || target.dataset.id === dragId) return;
  const from = works.findIndex((w) => w.id === dragId);
  const to = works.findIndex((w) => w.id === target.dataset.id);
  if (from < 0 || to < 0 || from === to) return;
  const [moved] = works.splice(from, 1);
  works.splice(to, 0, moved);
  dragReordered = true;
  renderWorkList();
});

workForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveActiveWork();
});

deleteButton.addEventListener("click", async () => {
  const work = activeWork();
  if (!work || !confirm(`Delete "${work.title}"?`)) return;
  works = works.filter((item) => item.id !== work.id);
  activeId = works[0]?.id || null;
  if (await persistWorks()) {
    renderWorkList();
    populateForm(activeWork());
    updateBadges();
    setStatus(saveStatus, "Deleted.");
  }
});

workForm.addEventListener("input", (event) => {
  const urlTarget = event.target.dataset.imageUrlTarget;
  if (urlTarget) {
    setImageField(urlTarget, event.target.value.trim());
  }
});

document.querySelectorAll("[data-image-target]").forEach((input) => {
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    setStatus(saveStatus, "Processing image...");
    try {
      const blob = await processImageUpload(file, input.dataset.imageTarget);
      const url = await uploadBlob(blob, input.dataset.imageTarget);
      setImageField(input.dataset.imageTarget, url);
      setStatus(saveStatus, "Image uploaded — save the project.");
    } catch (error) {
      setStatus(saveStatus, error.message, true);
    } finally {
      input.value = "";
    }
  });
});

addGalleryUrl.addEventListener("click", async () => {
  const value = galleryUrl.value.trim();
  if (!value) return;
  activeGallery.push(value);
  galleryUrl.value = "";
  renderGallery();
});

galleryUpload.addEventListener("change", async () => {
  const files = [...(galleryUpload.files || [])];
  if (!files.length) return;
  try {
    const urls = await uploadProcessedFiles(files, "gallery", "photo");
    activeGallery.push(...urls);
    renderGallery();
    setStatus(saveStatus, `${urls.length} photo${urls.length === 1 ? "" : "s"} uploaded — save the project.`);
  } catch (error) {
    setStatus(saveStatus, error.message, true);
  } finally {
    galleryUpload.value = "";
  }
});

heroUpload.addEventListener("change", async () => {
  const files = [...(heroUpload.files || [])];
  if (!files.length) return;
  try {
    const urls = await uploadProcessedFiles(files, "hero", "hero slide");
    activeHeroImages.push(...urls);
    renderHeroList();
    setStatus(saveStatus, `${urls.length} hero slide${urls.length === 1 ? "" : "s"} uploaded — save the project.`);
  } catch (error) {
    setStatus(saveStatus, error.message, true);
  } finally {
    heroUpload.value = "";
  }
});

galleryList.addEventListener("click", (event) => {
  const moveBtn = event.target.closest("[data-move-image]");
  if (moveBtn?.dataset.kind === "gallery") {
    moveImageInList("gallery", Number(moveBtn.dataset.index), moveBtn.dataset.moveImage);
    return;
  }
  const button = event.target.closest("[data-remove-gallery]");
  if (!button) return;
  activeGallery.splice(Number(button.dataset.removeGallery), 1);
  renderGallery();
});

heroList.addEventListener("click", (event) => {
  const moveBtn = event.target.closest("[data-move-image]");
  if (moveBtn?.dataset.kind === "hero") {
    moveImageInList("hero", Number(moveBtn.dataset.index), moveBtn.dataset.moveImage);
    return;
  }
  const button = event.target.closest("[data-remove-hero]");
  if (!button) return;
  activeHeroImages.splice(Number(button.dataset.removeHero), 1);
  renderHeroList();
});

const initImageListDnD = (container, kind) => {
  container.addEventListener("dragstart", (event) => {
    if (event.target.closest("button")) {
      event.preventDefault();
      return;
    }
    const item = event.target.closest(".gallery-item");
    if (!item || item.dataset.kind !== kind) return;
    imageDragKind = kind;
    imageDragIndex = Number(item.dataset.index);
    item.classList.add("is-dragging");
  });

  container.addEventListener("dragend", (event) => {
    event.target.closest(".gallery-item")?.classList.remove("is-dragging");
    imageDragKind = null;
    imageDragIndex = null;
  });

  container.addEventListener("dragover", (event) => {
    event.preventDefault();
    const target = event.target.closest(".gallery-item");
    if (!target || target.dataset.kind !== kind || imageDragKind !== kind) return;
    const targetIndex = Number(target.dataset.index);
    if (imageDragIndex === null || targetIndex === imageDragIndex) return;

    const list = getImageListByKind(kind);
    const [moved] = list.splice(imageDragIndex, 1);
    list.splice(targetIndex, 0, moved);
    imageDragIndex = targetIndex;
    if (kind === "hero") renderHeroList();
    else renderGallery();
    setStatus(saveStatus, "Photo order updated — save the project.");
  });
};

initImageListDnD(galleryList, "gallery");
initImageListDnD(heroList, "hero");

exportButton.addEventListener("click", () => {
  const blob = new Blob(
    [JSON.stringify({ version: 2, works, inquiries: window.SpiritWorks.getInquiries() }, null, 2)],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `spirit-creative-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

importInput.addEventListener("change", async () => {
  const file = importInput.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const importedWorks = Array.isArray(parsed) ? parsed : parsed.works;
    if (!Array.isArray(importedWorks)) throw new Error("Invalid backup file.");
    works = importedWorks.map(window.SpiritWorks.normalizeWork);
    await window.SpiritWorks.saveWorks(works);
    if (parsed.inquiries) await window.SpiritWorks.saveInquiries(parsed.inquiries);
    activeId = works[0]?.id || null;
    refreshAll();
    setStatus(saveStatus, "Imported successfully.");
  } catch (error) {
    setStatus(saveStatus, error.message, true);
  } finally {
    importInput.value = "";
  }
});

inquiriesList.addEventListener("click", async (event) => {
  const markBtn = event.target.closest("[data-mark-read]");
  if (markBtn) {
    await window.SpiritWorks.markInquiryRead(
      markBtn.dataset.markRead,
      markBtn.dataset.read === "true" ? false : true
    );
    renderInquiries();
    updateBadges();
    return;
  }
  const deleteBtn = event.target.closest("[data-delete-inquiry]");
  if (deleteBtn && confirm("Delete this inquiry?")) {
    await window.SpiritWorks.deleteInquiry(deleteBtn.dataset.deleteInquiry);
    renderInquiries();
    updateBadges();
  }
});

markAllRead.addEventListener("click", async () => {
  for (const inq of window.SpiritWorks.getInquiries()) {
    if (!inq.read) await window.SpiritWorks.markInquiryRead(inq.id, true);
  }
  renderInquiries();
  updateBadges();
});

logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  passwordInput.value = "";
  showLogin();
});

if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") showAdmin();
else showLogin();
