(function () {
  const WORKS_KEY = "theSpiritCreativeWorks";
  const INQUIRIES_KEY = "theSpiritCreativeInquiries";
  const STORAGE_VERSION = 2;

  const DEFAULT_WORKS = [
    {
      id: "matenits",
      title: "Matenits",
      services: "Packaging / Product Design",
      categories: ["packaging", "product"],
      industry: "Beverages",
      client: "Matenits",
      year: "2026",
      order: 0,
      visible: true,
      cardImage: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=1200&q=85",
      heroImage: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=1800&q=90",
      cardAlt: "Ornate premium bottle packaging",
      subtitle: "Ceremonial beverage packaging with ornate, gift-like detail.",
      overview: "A ceremonial drink brand inspired by illuminated manuscripts — a richly detailed package system with collectible, gift-like presence.",
      challenge: "Feel ancient and precious while remaining clear enough for modern retail and digital launch.",
      solution: "Ornamental frames, deep black space, jewel tones, and a compact symbol spanning bottle, box, and campaign.",
      statement: "Every surface is a small stage — dense pattern, quiet negative space, tactile contrast.",
      moreText: "Add process photography, close-ups, and launch copy when final assets are ready.",
      gallery: [
        "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1600&q=90",
        "https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=1600&q=90",
      ],
    },
    {
      id: "once",
      title: "Once",
      services: "Branding / Packaging",
      categories: ["branding", "packaging"],
      industry: "Spirits",
      client: "Once",
      year: "2026",
      order: 1,
      visible: true,
      cardImage: "https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?auto=format&fit=crop&w=1200&q=85",
      heroImage: "https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?auto=format&fit=crop&w=1800&q=90",
      cardAlt: "Round black bottle with metallic cap",
      subtitle: "Ultra-premium spirit identity built on rarity and restraint.",
      overview: "An ultra-premium spirit identity built around rarity, patience, and restraint.",
      challenge: "Communicate extraordinary value without decorative noise.",
      solution: "Dark architectural bottle world, precise typography, circular geometry, cinematic imagery.",
      statement: "The story unfolds through shadow, glass, and a single compact mark.",
      moreText: "Replace with final production notes and founder message when ready.",
      gallery: [
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=90",
        "https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?auto=format&fit=crop&w=1600&q=90",
      ],
    },
    {
      id: "hearth",
      title: "Hearth Archive",
      services: "Branding / Packaging",
      categories: ["branding", "packaging"],
      industry: "Fragrance",
      client: "Hearth Archive",
      year: "2025",
      order: 2,
      visible: true,
      cardImage: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1200&q=85",
      heroImage: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1800&q=90",
      cardAlt: "Amber perfume bottle on patterned backdrop",
      subtitle: "Warm fragrance system shaped by memory and ritual.",
      overview: "A warm fragrance system shaped by memory, ritual, and tactile material cues.",
      challenge: "Build intimacy while keeping the line scalable across multiple scents.",
      solution: "Muted typography, amber light, and pattern-led packaging for a quiet shelf world.",
      statement: "Designed to feel discovered rather than announced.",
      moreText: "Add ingredient notes and collection names when final copy is ready.",
      gallery: [
        "https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?auto=format&fit=crop&w=1600&q=90",
      ],
    },
    {
      id: "tame",
      title: "Tame",
      services: "Product / Creative Direction",
      categories: ["product", "direction"],
      industry: "Beauty",
      client: "Tame",
      year: "2025",
      order: 3,
      visible: true,
      cardImage: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=85",
      heroImage: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1800&q=90",
      cardAlt: "Cosmetic product with dramatic light",
      subtitle: "Minimal cosmetic brand with confident, controlled color.",
      overview: "A cosmetic concept built on simple routines and confident color.",
      challenge: "Make minimal product feel ownable without noisy decoration.",
      solution: "Controlled art direction with high-contrast sets and precise pack forms.",
      statement: "Softness and control in equal measure — clean silhouettes, direct photographic tone.",
      moreText: "Add final ingredients and campaign credits when ready.",
      gallery: [
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1600&q=90",
      ],
    },
    {
      id: "sahar",
      title: "Sahar Sun",
      services: "Packaging Design",
      categories: ["packaging"],
      industry: "Beverage",
      client: "Sahar Sun",
      year: "2025",
      order: 4,
      visible: true,
      cardImage: "https://images.unsplash.com/photo-1560461396-ec0ef7bb29dd?auto=format&fit=crop&w=1200&q=85",
      heroImage: "https://images.unsplash.com/photo-1560461396-ec0ef7bb29dd?auto=format&fit=crop&w=1800&q=90",
      cardAlt: "Colorful beverage cartons on pastel set",
      subtitle: "Playful drink packaging with bold shelf presence.",
      overview: "Playful drink packaging with bold shelf blocking and character-led flavor cues.",
      challenge: "Stand out in a crowded refrigerated aisle while keeping the family flexible.",
      solution: "High-energy illustration, simple flavor coding, bold pack silhouettes.",
      statement: "Built for fast recognition across cartons, cans, motion, and seasonal flavors.",
      moreText: "Add final SKU names and production images when ready.",
      gallery: [
        "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=1600&q=90",
      ],
    },
    {
      id: "runa",
      title: "Runa Wellness",
      services: "Branding / Creative Direction",
      categories: ["branding", "direction"],
      industry: "Wellness",
      client: "Runa",
      year: "2025",
      order: 5,
      visible: true,
      cardImage: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=1200&q=85",
      heroImage: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=1800&q=90",
      cardAlt: "Botanical skin care packaging",
      subtitle: "Natural care identity with calm, botanical rhythm.",
      overview: "Natural care identity with botanical materials and a calm visual rhythm.",
      challenge: "Create softness without becoming generic in a crowded wellness market.",
      solution: "Earthy photography, restrained type, modular brand kit for repeat launches.",
      statement: "Simple, tactile, slow — space for material, scent, and routine.",
      moreText: "Add founder story and certifications when ready.",
      gallery: [
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=90",
      ],
    },
    {
      id: "meridian",
      title: "Meridian Coffee",
      services: "Branding / Packaging",
      categories: ["branding", "packaging"],
      industry: "Food & Beverage",
      client: "Meridian",
      year: "2025",
      order: 6,
      visible: true,
      cardImage: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=85",
      heroImage: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1800&q=90",
      cardAlt: "Specialty coffee packaging",
      subtitle: "Specialty coffee brand with origin-forward storytelling.",
      overview: "Specialty coffee brand with origin-forward storytelling and refined pack architecture.",
      challenge: "Differentiate in a saturated specialty market without cliché craft aesthetics.",
      solution: "Typographic hierarchy, origin maps, and a restrained earth-tone system.",
      statement: "Every bag reads like a passport stamp — precise, warm, unmistakable.",
      moreText: "Add origin stories and roast profiles when final copy is ready.",
      gallery: [
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=90",
      ],
    },
    {
      id: "volt",
      title: "Volt Athletics",
      services: "Branding / Creative Direction",
      categories: ["branding", "direction"],
      industry: "Sportswear",
      client: "Volt",
      year: "2024",
      order: 7,
      visible: true,
      cardImage: "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1200&q=85",
      heroImage: "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1800&q=90",
      cardAlt: "Athletic brand visual identity",
      subtitle: "Performance sportswear with kinetic campaign language.",
      overview: "Performance sportswear identity with kinetic typography and high-contrast campaign language.",
      challenge: "Feel premium and technical without copying established athletic giants.",
      solution: "Modular wordmark, electric accent system, and motion-first art direction.",
      statement: "Energy encoded in every frame — speed, precision, controlled aggression.",
      moreText: "Add athlete partnerships and campaign credits when ready.",
      gallery: [
        "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1600&q=90",
      ],
    },
    {
      id: "aria",
      title: "Aria Hotels",
      services: "Branding / Creative Direction",
      categories: ["branding", "direction"],
      industry: "Hospitality",
      client: "Aria Group",
      year: "2024",
      order: 8,
      visible: true,
      cardImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
      heroImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=90",
      cardAlt: "Luxury hotel brand identity",
      subtitle: "Boutique hospitality identity with understated luxury.",
      overview: "Boutique hospitality brand balancing warmth, silence, and understated luxury.",
      challenge: "Create a unified identity across properties with distinct local character.",
      solution: "Flexible monogram system, editorial photography, and tactile print collateral.",
      statement: "Luxury that whispers — material, light, and service as the primary brand signals.",
      moreText: "Add property-specific guidelines when portfolio expands.",
      gallery: [
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1600&q=90",
      ],
    },
    {
      id: "nocturne",
      title: "Nocturne Spirits",
      services: "Packaging / Product Design",
      categories: ["packaging", "product"],
      industry: "Spirits",
      client: "Nocturne",
      year: "2024",
      order: 9,
      visible: true,
      cardImage: "https://images.unsplash.com/photo-1569529465841-df597ade617e?auto=format&fit=crop&w=1200&q=85",
      heroImage: "https://images.unsplash.com/photo-1569529465841-df597ade617e?auto=format&fit=crop&w=1800&q=90",
      cardAlt: "Dark spirits bottle design",
      subtitle: "Night-inspired gin line with lunar symbolism.",
      overview: "Night-inspired gin line with lunar symbolism and deep indigo material palette.",
      challenge: "Stand out on back-bar shelves dominated by transparent bottles.",
      solution: "Matte ceramic-feel glass, embossed moon phases, and copper foil accents.",
      statement: "Darkness as a design material — depth, mystery, and slow discovery.",
      moreText: "Add tasting notes and batch stories when ready.",
      gallery: [
        "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1600&q=90",
      ],
    },
    {
      id: "forma",
      title: "Forma Architecture",
      services: "Branding / Creative Direction",
      categories: ["branding", "direction"],
      industry: "Architecture",
      client: "Forma",
      year: "2024",
      order: 10,
      visible: true,
      cardImage: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1200&q=85",
      heroImage: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1800&q=90",
      cardAlt: "Architecture studio brand",
      subtitle: "Architecture practice rooted in structural clarity.",
      overview: "Architecture practice identity rooted in structural clarity and monolithic typography.",
      challenge: "Communicate precision and vision without cold corporate sterility.",
      solution: "Grid-based identity, architectural photography, and restrained motion principles.",
      statement: "Structure as language — every line intentional, every space considered.",
      moreText: "Add project portfolio and team bios when ready.",
      gallery: [
        "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=90",
      ],
    },
    {
      id: "lumen",
      title: "Lumen Skincare",
      services: "Product / Packaging",
      categories: ["product", "packaging"],
      industry: "Beauty",
      client: "Lumen",
      year: "2024",
      order: 11,
      visible: true,
      cardImage: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1200&q=85",
      heroImage: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1800&q=90",
      cardAlt: "Clinical skincare packaging",
      subtitle: "Clinical-meets-luxury skincare packaging system.",
      overview: "Clinical-meets-luxury skincare with transparent ingredient storytelling.",
      challenge: "Balance scientific credibility with aspirational beauty marketing.",
      solution: "Laboratory-inspired typography, glass-and-aluminum pack system, clean data visualization.",
      statement: "Transparency as luxury — every ingredient named, every claim earned.",
      moreText: "Add clinical study references when approved for public use.",
      gallery: [
        "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1600&q=90",
      ],
    },
  ];

  const clone = (value) => JSON.parse(JSON.stringify(value));

  const normalizeWork = (work, index = 0) => ({
    id: work.id || `work-${Date.now()}-${index}`,
    title: work.title || "Untitled Work",
    services: work.services || "",
    categories: Array.isArray(work.categories) ? work.categories : [],
    industry: work.industry || "",
    client: work.client || "",
    year: work.year || "",
    order: typeof work.order === "number" ? work.order : index,
    visible: work.visible !== false,
    cardImage: work.cardImage || "",
    heroImage: work.heroImage || work.cardImage || "",
    cardAlt: work.cardAlt || work.title || "Project image",
    subtitle: work.subtitle || (work.brandStory ? `${work.brandStory.split(".")[0]}.` : work.overview ? `${work.overview.split(".")[0]}.` : ""),
    brandStory:
      work.brandStory ||
      [work.overview, work.challenge, work.solution, work.statement, work.moreText].filter(Boolean).join("\n\n") ||
      "",
    heroImages: Array.isArray(work.heroImages)
      ? work.heroImages.filter(Boolean)
      : work.heroImage
        ? [work.heroImage]
        : [],
    gallery: Array.isArray(work.gallery) ? work.gallery.filter(Boolean) : [],
  });

  const sortWorks = (works) =>
    [...works].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

  const ADMIN_TOKEN_KEY = "spiritAdminToken";

  let worksCache = null;
  let inquiriesCache = null;
  let initPromise = null;

  const readWorksStore = () => {
    const saved = localStorage.getItem(WORKS_KEY);
    if (!saved) return clone(DEFAULT_WORKS);

    try {
      const parsed = JSON.parse(saved);
      const list = Array.isArray(parsed) ? parsed : parsed.works;
      if (!Array.isArray(list)) return clone(DEFAULT_WORKS);
      return sortWorks(list.map((work, index) => normalizeWork(work, index)));
    } catch {
      return clone(DEFAULT_WORKS);
    }
  };

  const cacheWorks = (works) => {
    const payload = {
      version: STORAGE_VERSION,
      updatedAt: new Date().toISOString(),
      works: sortWorks(works.map((work, index) => normalizeWork(work, index))),
    };
    localStorage.setItem(WORKS_KEY, JSON.stringify(payload));
    worksCache = payload.works;
    return worksCache;
  };

  const authHeaders = () => {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const apiRequest = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const message =
        typeof data === "object" && data?.error ? data.error : `Request failed (${response.status})`;
      throw new Error(message);
    }

    return data;
  };

  const init = async (options = {}) => {
    const { includeInquiries = false, force = false } = options;
    if (initPromise && !force) return initPromise;

    initPromise = (async () => {
      try {
        const data = await apiRequest("/api/works");
        if (Array.isArray(data?.works) && data.works.length) {
          cacheWorks(data.works);
        } else {
          worksCache = readWorksStore();
        }
      } catch {
        worksCache = readWorksStore();
      }

      if (includeInquiries) {
        try {
          const data = await apiRequest("/api/inquiries", { headers: authHeaders() });
          inquiriesCache = Array.isArray(data?.inquiries)
            ? data.inquiries.map(normalizeInquiry)
            : readInquiriesStore();
        } catch {
          inquiriesCache = readInquiriesStore();
        }
      }
    })();

    return initPromise;
  };

  const getWorks = (includeHidden = false) => {
    const works = worksCache ?? readWorksStore();
    if (includeHidden) return works;
    return works.filter((work) => work.visible);
  };

  const saveWorks = async (works) => {
    const normalized = cacheWorks(works);
    await apiRequest("/api/works", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ works: normalized }),
    });
    return normalized;
  };

  const resetWorks = () => {
    localStorage.removeItem(WORKS_KEY);
    worksCache = null;
  };

  const normalizeInquiry = (inquiry) => ({
    id: inquiry.id || `inq-${Date.now()}`,
    fullName: inquiry.fullName || "",
    company: inquiry.company || "",
    email: inquiry.email || "",
    phone: inquiry.phone || "",
    projectType: inquiry.projectType || "",
    budget: inquiry.budget || "",
    message: inquiry.message || "",
    createdAt: inquiry.createdAt || new Date().toISOString(),
    read: Boolean(inquiry.read),
  });

  const readInquiriesStore = () => {
    const saved = localStorage.getItem(INQUIRIES_KEY);
    if (!saved) return [];

    try {
      const parsed = JSON.parse(saved);
      const list = Array.isArray(parsed) ? parsed : parsed.inquiries;
      if (!Array.isArray(list)) return [];
      return list
        .map(normalizeInquiry)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch {
      return [];
    }
  };

  const cacheInquiries = (inquiries) => {
    const payload = {
      version: STORAGE_VERSION,
      updatedAt: new Date().toISOString(),
      inquiries: inquiries.map(normalizeInquiry),
    };
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(payload));
    inquiriesCache = payload.inquiries;
    return inquiriesCache;
  };

  const getInquiries = () => {
    const inquiries = inquiriesCache ?? readInquiriesStore();
    return [...inquiries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const saveInquiries = async (inquiries) => {
    cacheInquiries(inquiries);
    await apiRequest("/api/inquiries", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ inquiries: getInquiries() }),
    });
  };

  const addInquiry = async (data) => {
    const inquiry = normalizeInquiry({ ...data, id: `inq-${Date.now()}`, read: false });
    try {
      await apiRequest("/api/inquiries", {
        method: "POST",
        body: JSON.stringify(inquiry),
      });
      const inquiries = [inquiry, ...getInquiries()];
      cacheInquiries(inquiries);
    } catch {
      cacheInquiries([inquiry, ...readInquiriesStore()]);
    }
    return inquiry;
  };

  const markInquiryRead = async (id, read = true) => {
    const inquiries = getInquiries().map((item) => (item.id === id ? { ...item, read } : item));
    cacheInquiries(inquiries);
    try {
      await apiRequest("/api/inquiries", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ id, read }),
      });
    } catch {
      /* keep local cache updated even if sync fails */
    }
  };

  const deleteInquiry = async (id) => {
    cacheInquiries(getInquiries().filter((item) => item.id !== id));
    try {
      await apiRequest(`/api/inquiries?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
    } catch {
      /* keep local cache updated even if sync fails */
    }
  };

  const getUnreadCount = () => getInquiries().filter((item) => !item.read).length;

  window.SpiritWorks = {
    ADMIN_TOKEN_KEY,
    DEFAULT_WORKS: clone(DEFAULT_WORKS),
    WORKS_KEY,
    INQUIRIES_KEY,
    init,
    getWorks,
    normalizeWork,
    resetWorks,
    saveWorks,
    getInquiries,
    saveInquiries,
    addInquiry,
    markInquiryRead,
    deleteInquiry,
    getUnreadCount,
    sortWorks,
  };
})();
