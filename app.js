const SOURCE_DEFINITIONS = [
  {
    id: "amazon-in",
    label: "Amazon India",
    market: "domestic",
    marketLabel: "India",
    currency: "INR",
    maxResults: 6,
    timeoutMs: 6500,
    buildSearchUrl(query) {
      return `https://www.amazon.in/s?k=${encodeURIComponent(query).replace(
        /%20/g,
        "+"
      )}`;
    },
    parser: parseAmazonMarkdown,
  },
  {
    id: "croma",
    label: "Croma",
    market: "domestic",
    marketLabel: "India",
    currency: "INR",
    maxResults: 6,
    timeoutMs: 5000,
    buildSearchUrl(query) {
      return `https://www.croma.com/searchB?q=${encodeURIComponent(
        `${query}:relevance`
      )}`;
    },
    parser: parseCromaMarkdown,
  },
  {
    id: "ebay",
    label: "eBay",
    market: "import",
    marketLabel: "Global",
    currency: "USD",
    maxResults: 6,
    timeoutMs: 6500,
    buildSearchUrl(query) {
      return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query).replace(
        /%20/g,
        "+"
      )}`;
    },
    parser: parseEbayMarkdown,
  },
  {
    id: "aliexpress",
    label: "AliExpress",
    market: "import",
    marketLabel: "Global",
    currency: "USD",
    maxResults: 6,
    timeoutMs: 7000,
    buildSearchUrl(query) {
      return `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(
        query
      ).replace(/%20/g, "+")}`;
    },
    parser: parseAliExpressMarkdown,
  },
  {
    id: "walmart",
    label: "Walmart",
    market: "import",
    marketLabel: "Global",
    currency: "USD",
    maxResults: 5,
    timeoutMs: 5500,
    buildSearchUrl(query) {
      return `https://www.walmart.com/search?q=${encodeURIComponent(query).replace(
        /%20/g,
        "+"
      )}`;
    },
    parser: parseWalmartMarkdown,
  },
  {
    id: "bestbuy",
    label: "Best Buy",
    market: "import",
    marketLabel: "Global",
    currency: "USD",
    maxResults: 5,
    timeoutMs: 5000,
    buildSearchUrl(query) {
      return `https://www.bestbuy.com/site/searchpage.jsp?st=${encodeURIComponent(
        query
      ).replace(/%20/g, "+")}`;
    },
    parser: parseBestBuyMarkdown,
  },
];

const STORAGE_KEYS = {
  theme: "landed-in-india-theme",
  settings: "landed-in-india-settings",
  savedOffers: "landed-in-india-saved-offers",
  history: "landed-in-india-search-history",
  lastRun: "landed-in-india-last-run",
  exchangeRates: "landed-in-india-exchange-rates",
  sourceCache: "landed-in-india-source-cache",
};

const IMPORT_MODE_DETAILS = {
  personal: {
    label: "Personal buy",
    rate: 42.08,
    formula:
      "Personal import estimate: assessable value plus 42.08% duty, then any courier handling fee.",
  },
  gift: {
    label: "Gift import",
    rate: 77.28,
    formula:
      "Gift estimate: assessable value plus 77.28% duty, then any courier handling fee.",
  },
  custom: {
    label: "Custom rate",
    rate: null,
    formula:
      "Custom mode uses your own duty percentage on the assessable value, then adds any courier handling fee.",
  },
};

const DEFAULT_SETTINGS = {
  enabledSources: SOURCE_DEFINITIONS.map((source) => source.id),
  dutyMode: "personal",
  customDutyRate: 42.08,
  shippingBufferPercent: 8,
  insurancePercent: 0,
  handlingFeeInr: 0,
};

const DEFAULT_EXCHANGE_RATES = {
  USD: 93.85,
};

const SOURCE_CACHE_VERSION = 1;
const SOURCE_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const MAX_SOURCE_CACHE_ENTRIES = 32;

const ACCESSORY_KEYWORDS = [
  "case",
  "cover",
  "charger",
  "charging",
  "cable",
  "adapter",
  "screen",
  "protector",
  "tempered",
  "glass",
  "skin",
  "wallet",
  "mount",
  "holder",
  "tripod",
  "support",
  "lumbar",
  "pillow",
  "cushion",
  "replacement",
  "wheel",
  "armrest",
  "mat",
  "power",
  "bank",
  "ssd",
  "earbuds",
  "earphones",
  "headphones",
  "sticker",
  "strap",
  "dock",
  "stand",
  "lens",
  "accessory",
  "accessories",
  "magsafe",
];

const DAMAGED_LISTING_PATTERNS = [
  "broken",
  "for parts",
  "parts only",
  "damaged",
  "wear and tear",
  "repair",
];

const state = {
  query: "",
  results: [],
  filter: "all",
  sort: "landed",
  searching: false,
  errors: [],
  savedOffers: [],
  history: [],
  lastRun: null,
  theme: "light",
  settings: { ...DEFAULT_SETTINGS },
  exchangeRates: { ...DEFAULT_EXCHANGE_RATES },
  ratesUpdatedAt: null,
  sourceCache: {},
  searchSessionId: 0,
  sourceStatuses: Object.fromEntries(
    SOURCE_DEFINITIONS.map((source) => [source.id, { state: "idle", detail: "" }])
  ),
};

const elements = {
  themeToggle: document.querySelector("#theme-toggle"),
  themeModeLabel: document.querySelector("#theme-mode-label"),
  searchForm: document.querySelector("#search-form"),
  searchInput: document.querySelector("#search-input"),
  searchButton: document.querySelector("#search-button"),
  sourceNote: document.querySelector("#source-note"),
  lastUpdated: document.querySelector("#last-updated"),
  sourceToggleList: document.querySelector("#source-toggle-list"),
  savedCountBadge: document.querySelector("#saved-count-badge"),
  fxRateDisplay: document.querySelector("#fx-rate-display"),
  importModeBadge: document.querySelector("#import-mode-badge"),
  offersCount: document.querySelector("#offers-count"),
  bestDomestic: document.querySelector("#best-domestic"),
  bestImport: document.querySelector("#best-import"),
  bestOverall: document.querySelector("#best-overall"),
  resultCountNote: document.querySelector("#result-count-note"),
  spotlightGrid: document.querySelector("#spotlight-grid"),
  issuesPanel: document.querySelector("#issues-panel"),
  issuesList: document.querySelector("#issues-list"),
  restoreLastButton: document.querySelector("#restore-last-button"),
  refreshFxButton: document.querySelector("#refresh-fx-button"),
  modeSelect: document.querySelector("#mode-select"),
  customDutyWrap: document.querySelector("#custom-duty-wrap"),
  customDutyInput: document.querySelector("#custom-duty-input"),
  shippingBufferInput: document.querySelector("#shipping-buffer-input"),
  insuranceInput: document.querySelector("#insurance-input"),
  handlingFeeInput: document.querySelector("#handling-fee-input"),
  formulaNote: document.querySelector("#formula-note"),
  filterGroup: document.querySelector("#filter-group"),
  sortSelect: document.querySelector("#sort-select"),
  resultsGrid: document.querySelector("#results-grid"),
  resultsEmpty: document.querySelector("#results-empty"),
  savedGrid: document.querySelector("#saved-grid"),
  historyList: document.querySelector("#history-list"),
  clearSavedButton: document.querySelector("#clear-saved-button"),
  clearHistoryButton: document.querySelector("#clear-history-button"),
  storageSummary: document.querySelector("#storage-summary"),
};

init().catch((error) => {
  console.error(error);
});

async function init() {
  hydrateState();
  attachEventListeners();
  syncSettingsInputs();
  renderAll();
  maybeRefreshExchangeRate();
}

function hydrateState() {
  state.settings = {
    ...DEFAULT_SETTINGS,
    ...readStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
  };
  state.savedOffers = readStorage(STORAGE_KEYS.savedOffers, []);
  state.history = readStorage(STORAGE_KEYS.history, []);
  state.lastRun = readStorage(STORAGE_KEYS.lastRun, null);

  const exchangePayload = readStorage(STORAGE_KEYS.exchangeRates, null);
  if (exchangePayload?.rates) {
    state.exchangeRates = {
      ...DEFAULT_EXCHANGE_RATES,
      ...exchangePayload.rates,
    };
    state.ratesUpdatedAt = exchangePayload.updatedAt ?? null;
  }

  const cachedSourcePayload = readStorage(STORAGE_KEYS.sourceCache, null);
  if (cachedSourcePayload?.version === SOURCE_CACHE_VERSION) {
    state.sourceCache = pruneSourceCacheEntries(cachedSourcePayload.entries ?? {});
  }

  const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  state.theme = storedTheme || getSystemTheme();
  document.body.dataset.theme = state.theme;

  if (state.lastRun?.results?.length) {
    state.query = state.lastRun.query ?? "";
    state.results = decorateOffers(state.lastRun.results);
  }

  if (state.query) {
    elements.searchInput.value = state.query;
  }
}

function attachEventListeners() {
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.restoreLastButton.addEventListener("click", restoreLastRun);
  elements.refreshFxButton.addEventListener("click", () =>
    refreshExchangeRate({ force: true, announce: true })
  );

  elements.searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = elements.searchInput.value.trim();
    if (!query) {
      elements.searchInput.focus();
      return;
    }
    await performSearch(query);
  });

  document.querySelectorAll("[data-quick-query]").forEach((button) => {
    button.addEventListener("click", async () => {
      const query = button.dataset.quickQuery ?? "";
      elements.searchInput.value = query;
      await performSearch(query);
    });
  });

  elements.sourceToggleList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-source-id]");
    if (!button) {
      return;
    }
    toggleSource(button.dataset.sourceId);
  });

  elements.filterGroup.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) {
      return;
    }
    state.filter = button.dataset.filter;
    renderResults();
    syncFilterButtons();
    renderHeaderMeta();
  });

  elements.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderResults();
  });

  elements.modeSelect.addEventListener("change", () => {
    state.settings.dutyMode = elements.modeSelect.value;
    persistSettings();
    syncSettingsInputs();
    rerateStoredOffers();
  });

  elements.customDutyInput.addEventListener("input", () => {
    state.settings.customDutyRate = clampNumber(
      elements.customDutyInput.value,
      0,
      200,
      DEFAULT_SETTINGS.customDutyRate
    );
    persistSettings();
    rerateStoredOffers();
  });

  elements.shippingBufferInput.addEventListener("input", () => {
    state.settings.shippingBufferPercent = clampNumber(
      elements.shippingBufferInput.value,
      0,
      100,
      DEFAULT_SETTINGS.shippingBufferPercent
    );
    persistSettings();
    rerateStoredOffers();
  });

  elements.insuranceInput.addEventListener("input", () => {
    state.settings.insurancePercent = clampNumber(
      elements.insuranceInput.value,
      0,
      20,
      DEFAULT_SETTINGS.insurancePercent
    );
    persistSettings();
    rerateStoredOffers();
  });

  elements.handlingFeeInput.addEventListener("input", () => {
    state.settings.handlingFeeInr = clampNumber(
      elements.handlingFeeInput.value,
      0,
      5000,
      DEFAULT_SETTINGS.handlingFeeInr
    );
    persistSettings();
    rerateStoredOffers();
  });

  elements.resultsGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-save-offer]");
    if (!button) {
      return;
    }
    toggleSaveOffer(button.dataset.saveOffer);
  });

  elements.savedGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-offer]");
    if (button) {
      toggleSaveOffer(button.dataset.removeOffer);
    }
  });

  elements.historyList.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-history-query]");
    if (!button) {
      return;
    }
    const query = button.dataset.historyQuery ?? "";
    elements.searchInput.value = query;
    await performSearch(query);
  });

  elements.clearSavedButton.addEventListener("click", () => {
    state.savedOffers = [];
    persistSavedOffers();
    renderSaved();
    renderStorageSummary();
    renderHeaderMeta();
  });

  elements.clearHistoryButton.addEventListener("click", () => {
    state.history = [];
    persistHistory();
    renderHistory();
    renderStorageSummary();
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener(
    "change",
    () => {
      if (!localStorage.getItem(STORAGE_KEYS.theme)) {
        state.theme = getSystemTheme();
        document.body.dataset.theme = state.theme;
        renderHeaderMeta();
      }
    }
  );
}

async function performSearch(query) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return;
  }

  const activeSources = getActiveSources();
  const searchSessionId = state.searchSessionId + 1;
  const cachedSeed = activeSources.flatMap(
    (source) => readSourceCache(source.id, trimmedQuery) ?? []
  );

  state.searchSessionId = searchSessionId;
  state.query = trimmedQuery;
  state.searching = true;
  state.errors = [];
  state.results = decorateOffers(dedupeOffers(cachedSeed));
  resetSourceStatuses();
  renderAll();

  if (hasActiveImportSource()) {
    maybeRefreshExchangeRate({ silent: true }).catch((error) => {
      console.warn(error);
    });
  }

  try {
    const liveResults = [];
    const searchTasks = activeSources.map(async (source) => {
      const sourceResults = await searchSource(source, trimmedQuery, searchSessionId);
      if (!isSearchSessionActive(searchSessionId)) {
        return sourceResults;
      }

      liveResults.push(...sourceResults);
      state.results = decorateOffers(dedupeOffers([...cachedSeed, ...liveResults]));
      renderSearchProgress();
      return sourceResults;
    });

    const taskResults = await Promise.all(searchTasks);
    if (!isSearchSessionActive(searchSessionId)) {
      return;
    }

    const merged = dedupeOffers([...cachedSeed, ...taskResults.flat()]);
    state.results = decorateOffers(merged);
    updateHistory(trimmedQuery, state.results.length);
    persistLastRun();
  } catch (error) {
    if (!isSearchSessionActive(searchSessionId)) {
      return;
    }
    console.warn(error);
    state.errors.push(error.message || "Search failed unexpectedly.");
  } finally {
    if (!isSearchSessionActive(searchSessionId)) {
      return;
    }
    state.searching = false;
    renderAll();
  }
}

async function searchSource(source, query, searchSessionId) {
  if (isSearchSessionActive(searchSessionId)) {
    setSourceStatus(source.id, "loading", "Scanning");
  }
  try {
    const rawText = await fetchSourceText(source, query);
    const parsed = source.parser(rawText, query)
      .map((offer) => ({
        ...offer,
        sourceId: source.id,
        sourceLabel: source.label,
        market: source.market,
        marketLabel: source.marketLabel,
        currency: offer.currency || source.currency,
      }))
      .filter((offer) => Number.isFinite(offer.price) && offer.price > 0);

    const ranked = rankOffersForQuery(parsed, query).slice(0, source.maxResults);
    writeSourceCache(source.id, query, ranked);
    if (isSearchSessionActive(searchSessionId)) {
      setSourceStatus(source.id, "success", `${ranked.length} offers`);
    }
    return ranked;
  } catch (error) {
    const cachedOffers = readSourceCache(source.id, query);
    if (cachedOffers?.length) {
      if (isSearchSessionActive(searchSessionId)) {
        setSourceStatus(source.id, "success", `${cachedOffers.length} saved offers`);
      }
      return cachedOffers;
    }

    if (isSearchSessionActive(searchSessionId)) {
      setSourceStatus(source.id, "error", error.message);
      state.errors.push(`${source.label}: ${error.message}`);
    }
    return [];
  }
}

async function fetchSourceText(source, query) {
  const readerUrl = buildReaderUrl(source.buildSearchUrl(query));
  const timeoutMs = source.timeoutMs ?? 7000;

  try {
    const response = await fetchWithTimeout(readerUrl, {
      headers: {
        Accept: "text/plain",
      },
    }, timeoutMs);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    if (!text || text.length < 80) {
      throw new Error("No readable results");
    }
    if (/Bad Request|Too Many Requests|AuthenticationRequiredError/i.test(text)) {
      throw new Error("Source blocked or unavailable");
    }

    return text;
  } catch (error) {
    if (error.name === "AbortError" || /timed out/i.test(error.message)) {
      throw new Error("Timed out");
    }
    throw error;
  }
}

function buildReaderUrl(targetUrl) {
  const normalizedUrl = targetUrl.replace(/^https?:\/\//, "");
  return `https://r.jina.ai/http://${normalizedUrl}`;
}

function parseAmazonMarkdown(text) {
  const linkedOffers = parseAmazonLinkedMarkdown(text);
  const plainOffers = parseAmazonPlainTextResults(text);
  return dedupeParsedOffers([...linkedOffers, ...plainOffers]);
}

function parseAmazonLinkedMarkdown(text) {
  const offers = [];
  const lines = text.split(/\r?\n/);
  let pending = null;
  let recentImage = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const imageMatch = line.match(
      /\[\!\[Image \d+: [^\]]+\]\((https?:\/\/[^)]+)\)\]\((https?:\/\/www\.amazon\.in\/[^)]+)\)/
    );
    if (imageMatch) {
      recentImage = imageMatch[1];
    }

    const titleMatch = line.match(
      /\[\#\# ([^\]]+)\]\((https?:\/\/www\.amazon\.in\/[^)]+)\)/
    );
    if (titleMatch) {
      pending = {
        title: cleanTitle(titleMatch[1]),
        url: titleMatch[2],
        image: recentImage || "",
      };
      continue;
    }

    const priceMatch = line.match(/Price, product page\[₹([\d,]+(?:\.\d+)?)/);
    if (priceMatch && pending) {
      offers.push({
        ...pending,
        price: parseNumericPrice(priceMatch[1]),
      });
      pending = null;
      recentImage = "";
    }
  }

  return offers;
}

function parseAmazonPlainTextResults(text) {
  const offers = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => cleanTitle(line))
    .filter(Boolean);

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index] !== "Price, product page") {
      continue;
    }

    const title = pickAmazonPlainTextTitle(lines, index);
    const price = pickAmazonPlainTextPrice(lines, index + 1);
    if (!title || !Number.isFinite(price)) {
      continue;
    }

    offers.push({
      title,
      url: buildAmazonSearchUrl(title),
      image: "",
      price,
    });
  }

  return offers;
}

function parseCromaMarkdown(text) {
  const offers = [];
  const regex =
    /\[!\[Image \d+: ([^\]]+)\]\((https?:\/\/[^)]+)\)\]\((https:\/\/www\.croma\.com\/[^)]+)\)Compare\s+₹([\d,]+(?:\.\d+)?)/g;

  for (const match of text.matchAll(regex)) {
    offers.push({
      title: cleanTitle(match[1]),
      image: match[2],
      url: match[3],
      price: parseNumericPrice(match[4]),
    });
  }

  return offers;
}

function dedupeParsedOffers(offers) {
  const seen = new Set();
  return offers.filter((offer) => {
    const key = `${normalizeForMatch(offer.title)}::${offer.price}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function parseEbayMarkdown(text) {
  const offers = [];
  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.includes("ebay.com/itm/") || !line.includes("Opens in a new window or tab")) {
      continue;
    }

    const titleMatch = line.match(
      /\[([^\]]+?) Opens in a new window or tab\]\((https:\/\/www\.ebay\.com\/itm\/[^)]+)\)/
    );
    const priceMatch = line.match(
      /(?:Brand New|Open Box|Pre-Owned|Used|Seller refurbished|Excellent - Refurbished|Good - Refurbished)?\s*\$([\d,.]+)/
    );

    if (!titleMatch || !priceMatch) {
      continue;
    }

    const imageMatch = line.match(
      /!\[Image \d+: [^\]]+\]\((https?:\/\/[^)]+)\)\]\((https:\/\/www\.ebay\.com\/itm\/[^)]+)\)/
    );

    offers.push({
      title: cleanTitle(titleMatch[1]),
      url: titleMatch[2],
      image: imageMatch?.[1] ?? "",
      price: parseNumericPrice(priceMatch[1]),
      note: /Free delivery/i.test(line) ? "Free delivery shown" : "",
    });
  }

  return offers;
}

function parseAliExpressMarkdown(text) {
  const offers = [];
  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.includes("### ") || !line.includes("aliexpress") || !line.includes("$")) {
      continue;
    }

    const titleMatch = line.match(/### (.+?) \$([\d,.]+)/);
    if (!titleMatch) {
      continue;
    }

    const urlMatches = [...line.matchAll(/\]\((https:\/\/www\.aliexpress\.[^)]+)\)/g)];
    const url = urlMatches.at(-1)?.[1];
    if (!url) {
      continue;
    }

    const imageMatch = line.match(/!\[Image \d+: [^\]]+\]\((https?:\/\/[^)]+)\)/);
    offers.push({
      title: cleanTitle(titleMatch[1]),
      url,
      image: imageMatch?.[1] ?? "",
      price: parseNumericPrice(titleMatch[2]),
    });
  }

  return offers;
}

function parseWalmartMarkdown(text) {
  const offers = [];
  const regex =
    /\[### (.+?) \$([\d,.]+)\]\((https?:\/\/www\.walmart\.com\/[^)]+)\)/g;

  for (const match of text.matchAll(regex)) {
    offers.push({
      title: cleanRetailTitle(match[1]),
      url: normalizeWalmartUrl(match[3]),
      image: "",
      price: parseNumericPrice(match[2]),
    });
  }

  return offers;
}

function parseBestBuyMarkdown(text) {
  const offers = [];
  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.includes("[### ") || !line.includes("bestbuy.com/product/")) {
      continue;
    }

    const titleMatch = line.match(
      /\[### (.+?)\]\((https:\/\/www\.bestbuy\.com\/product\/[^)]+)\)/
    );
    const priceMatch = line.match(/\$([\d,]+(?:\.\d{2})?)/);
    if (!titleMatch || !priceMatch) {
      continue;
    }

    const imageMatch = line.match(
      /\[!\[Image \d+: [^\]]+\]\((https?:\/\/[^)]+)\)\]\((https:\/\/www\.bestbuy\.com\/product\/[^)]+)\)/
    );

    offers.push({
      title: cleanRetailTitle(titleMatch[1]),
      url: titleMatch[2],
      image: imageMatch?.[1] ?? "",
      price: parseNumericPrice(priceMatch[1]),
      note: /FREE/i.test(line) ? "Free shipping shown" : "",
    });
  }

  return offers;
}

function rankOffersForQuery(offers, query) {
  const normalizedQuery = normalizeForMatch(query);
  const queryTokens = splitTokens(normalizedQuery);
  const hasNumericToken = queryTokens.some((token) => /\d/.test(token));
  const queryLooksAccessory = looksLikeAccessory(queryTokens);
  const withScore = offers.map((offer) => ({
    ...offer,
    relevanceScore: computeRelevanceScore(
      offer.title,
      normalizedQuery,
      queryTokens,
      queryLooksAccessory
    ),
  }));

  const exactMatches = withScore.filter((offer) => offer.relevanceScore >= 3);
  const tightMatches = withScore.filter((offer) => offer.relevanceScore >= 2.2);
  const broadMatches = withScore.filter((offer) => offer.relevanceScore >= 1.1);

  let pool = withScore.filter((offer) => offer.relevanceScore >= 0.45);

  if (queryTokens.length > 1) {
    if (exactMatches.length > 0) {
      pool = exactMatches;
    } else if (tightMatches.length > 0) {
      pool = tightMatches;
    } else if (!hasNumericToken && broadMatches.length > 0) {
      pool = broadMatches;
    } else {
      pool = [];
    }
  }

  return pool.sort((left, right) => {
    if (right.relevanceScore !== left.relevanceScore) {
      return right.relevanceScore - left.relevanceScore;
    }
    return left.price - right.price;
  });
}

function computeRelevanceScore(title, normalizedQuery, queryTokens, queryLooksAccessory) {
  const normalizedTitle = normalizeForMatch(title);
  if (!normalizedTitle) {
    return 0;
  }

  const titleTokens = splitTokens(normalizedTitle);
  const titleLooksAccessory = looksLikeAccessory(titleTokens);

  if (!queryLooksAccessory && titleLooksAccessory) {
    return 0.1;
  }

  if (!queryAllowsDamagedListings(normalizedQuery) && looksLikeDamagedListing(normalizedTitle)) {
    return 0.12;
  }

  if (queryTokens.length > 0 && hasExactSequence(titleTokens, queryTokens)) {
    return 3;
  }

  if (queryTokens.length > 1 && hasTightOrderedMatch(titleTokens, queryTokens, 0)) {
    return 2.2;
  }

  if (queryTokens.length > 1 && queryTokens.every((token) => titleTokens.includes(token))) {
    return 1.1;
  }

  if (queryTokens.length === 0) {
    return 0;
  }

  const titleTokenSet = new Set(titleTokens);
  const matchedTokens = queryTokens.filter((token) => titleTokenSet.has(token)).length;
  return matchedTokens / queryTokens.length;
}

function hasTightOrderedMatch(titleTokens, queryTokens, maxGap) {
  if (!titleTokens.length || !queryTokens.length) {
    return false;
  }

  for (let startIndex = 0; startIndex < titleTokens.length; startIndex += 1) {
    if (titleTokens[startIndex] !== queryTokens[0]) {
      continue;
    }

    let currentIndex = startIndex;
    let matched = true;

    for (let tokenIndex = 1; tokenIndex < queryTokens.length; tokenIndex += 1) {
      const nextToken = queryTokens[tokenIndex];
      let foundIndex = -1;
      const searchUntil = Math.min(titleTokens.length - 1, currentIndex + maxGap + 1);

      for (let scanIndex = currentIndex + 1; scanIndex <= searchUntil; scanIndex += 1) {
        if (titleTokens[scanIndex] === nextToken) {
          foundIndex = scanIndex;
          break;
        }
      }

      if (foundIndex === -1) {
        matched = false;
        break;
      }

      currentIndex = foundIndex;
    }

    if (matched) {
      return true;
    }
  }

  return false;
}

function hasExactSequence(titleTokens, queryTokens) {
  if (!titleTokens.length || !queryTokens.length || queryTokens.length > titleTokens.length) {
    return false;
  }

  for (let startIndex = 0; startIndex <= titleTokens.length - queryTokens.length; startIndex += 1) {
    let matched = true;
    for (let tokenIndex = 0; tokenIndex < queryTokens.length; tokenIndex += 1) {
      if (titleTokens[startIndex + tokenIndex] !== queryTokens[tokenIndex]) {
        matched = false;
        break;
      }
    }
    if (matched) {
      return true;
    }
  }

  return false;
}

function queryAllowsDamagedListings(normalizedQuery) {
  return /used|refurbished|repair|parts/.test(normalizedQuery);
}

function looksLikeDamagedListing(normalizedTitle) {
  return DAMAGED_LISTING_PATTERNS.some((pattern) => normalizedTitle.includes(pattern));
}

function decorateOffers(offers) {
  const repriced = repriceOffers(
    offers.map((offer) => ({
      ...offer,
      id:
        offer.id ||
        createOfferId(offer.sourceId, offer.title, offer.price, offer.currency),
    }))
  );

  const bestDomestic = getBestOffer(repriced, "domestic");
  const bestImport = getBestOffer(repriced, "import");

  return [...repriced]
    .map((offer) => {
      const reference =
        offer.market === "import"
          ? bestDomestic?.landedCostInr ?? null
          : bestImport?.landedCostInr ?? null;

      const deltaInr =
        reference !== null ? offer.landedCostInr - reference : null;

      return {
        ...offer,
        referenceDeltaInr: deltaInr,
      };
    })
    .sort((left, right) => left.landedCostInr - right.landedCostInr);
}

function repriceOffers(offers) {
  return offers.map((offer) => applyCostModel(offer));
}

function applyCostModel(offer) {
  const basePriceInr = convertToInr(offer.price, offer.currency);
  const isImport = offer.market === "import";
  const dutyRate = isImport ? getSelectedDutyRate() : 0;
  const shippingBufferInr = isImport
    ? roundMoney(basePriceInr * (state.settings.shippingBufferPercent / 100))
    : 0;
  const insuranceInr = isImport
    ? roundMoney(basePriceInr * (state.settings.insurancePercent / 100))
    : 0;
  const handlingFeeInr = isImport ? state.settings.handlingFeeInr : 0;
  const assessableValueInr = roundMoney(
    basePriceInr + shippingBufferInr + insuranceInr
  );

  // The landed-cost model uses a flat duty estimate on the assessable value.
  const dutyInr = isImport
    ? roundMoney(assessableValueInr * (dutyRate / 100))
    : 0;

  const landedCostInr = roundMoney(
    isImport ? assessableValueInr + dutyInr + handlingFeeInr : basePriceInr
  );

  return {
    ...offer,
    price: roundMoney(offer.price),
    basePriceInr,
    shippingBufferInr,
    insuranceInr,
    handlingFeeInr,
    assessableValueInr,
    dutyRate,
    dutyInr,
    landedCostInr,
    listedLabel: formatMoney(offer.price, offer.currency),
    landedLabel: formatMoney(landedCostInr, "INR"),
  };
}

function getSelectedDutyRate() {
  const mode = state.settings.dutyMode;
  if (mode === "custom") {
    return clampNumber(
      state.settings.customDutyRate,
      0,
      200,
      DEFAULT_SETTINGS.customDutyRate
    );
  }
  return IMPORT_MODE_DETAILS[mode]?.rate ?? IMPORT_MODE_DETAILS.personal.rate;
}

function convertToInr(amount, currency) {
  if (currency === "INR") {
    return roundMoney(amount);
  }

  const rate = state.exchangeRates[currency];
  if (!rate) {
    return roundMoney(amount);
  }

  return roundMoney(amount * rate);
}

async function maybeRefreshExchangeRate(options = {}) {
  const updatedAt = state.ratesUpdatedAt ? new Date(state.ratesUpdatedAt).getTime() : 0;
  const isStale = Date.now() - updatedAt > 1000 * 60 * 60 * 12;
  if (!options.force && updatedAt && !isStale) {
    renderHeaderMeta();
    return;
  }
  await refreshExchangeRate(options);
}

async function refreshExchangeRate({ force = false, announce = false, silent = false } = {}) {
  if (!force && !hasActiveImportSource()) {
    return;
  }

  try {
    const payload = await fetchExchangeRates();
    if (!payload?.rates?.INR) {
      throw new Error("FX payload missing INR");
    }

    state.exchangeRates.USD = Number(payload.rates.INR);
    state.ratesUpdatedAt = new Date().toISOString();
    localStorage.setItem(
      STORAGE_KEYS.exchangeRates,
      JSON.stringify({
        rates: state.exchangeRates,
        updatedAt: state.ratesUpdatedAt,
      })
    );

    rerateStoredOffers({ preserveRender: true });
    if (announce && !silent) {
      elements.lastUpdated.textContent = `FX updated just now. Last rate: ${formatFxLine()}.`;
    }
  } catch (error) {
    console.warn(error);
    if (!silent) {
      elements.lastUpdated.textContent =
        "FX refresh failed, so the last stored INR conversion is still in use.";
    }
  }
}

async function fetchExchangeRates() {
  const primaryUrl = "https://api.frankfurter.app/latest?from=USD&to=INR";
  const fallbackUrl =
    "https://api.exchangerate-api.com/v4/latest/USD";

  try {
    const response = await fetchWithTimeout(primaryUrl, {
      headers: {
        Accept: "application/json,text/plain",
      },
    }, 6000);
    const text = await response.text();
    const payload = JSON.parse(text);
    if (payload?.rates?.INR) {
      return payload;
    }
  } catch (error) {
    console.warn(error);
  }

  const fallbackResponse = await fetchWithTimeout(fallbackUrl, {
    headers: {
      Accept: "application/json,text/plain",
    },
  }, 6000);
  const fallbackText = await fallbackResponse.text();
  const fallbackPayload = JSON.parse(fallbackText);
  return {
    rates: {
      INR: fallbackPayload?.rates?.INR,
    },
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

function rerateStoredOffers({ preserveRender = false } = {}) {
  state.results = decorateOffers(state.results);
  state.savedOffers = repriceOffers(state.savedOffers);
  persistSavedOffers();
  persistLastRun();
  if (!preserveRender) {
    renderAll();
  } else {
    renderHeaderMeta();
    renderSummary();
    renderSpotlights();
    renderResults();
    renderSaved();
    renderStorageSummary();
  }
}

function restoreLastRun() {
  if (!state.lastRun?.results?.length) {
    elements.lastUpdated.textContent = "No previous scan is stored in this browser yet.";
    return;
  }

  state.query = state.lastRun.query ?? "";
  state.results = decorateOffers(state.lastRun.results);
  elements.searchInput.value = state.query;
  renderAll();
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  document.body.dataset.theme = state.theme;
  localStorage.setItem(STORAGE_KEYS.theme, state.theme);
  renderHeaderMeta();
}

function toggleSource(sourceId) {
  const enabled = new Set(state.settings.enabledSources);
  if (enabled.has(sourceId) && enabled.size > 1) {
    enabled.delete(sourceId);
  } else {
    enabled.add(sourceId);
  }
  state.settings.enabledSources = SOURCE_DEFINITIONS.filter((source) =>
    enabled.has(source.id)
  ).map((source) => source.id);

  persistSettings();
  resetSourceStatuses();
  renderSourceChips();
  renderHeaderMeta();
}

function toggleSaveOffer(offerId) {
  const existingIndex = state.savedOffers.findIndex((offer) => offer.id === offerId);
  if (existingIndex >= 0) {
    state.savedOffers.splice(existingIndex, 1);
  } else {
    const currentOffer =
      state.results.find((offer) => offer.id === offerId) ||
      state.savedOffers.find((offer) => offer.id === offerId);

    if (currentOffer) {
      state.savedOffers.unshift({ ...currentOffer });
      state.savedOffers = state.savedOffers.slice(0, 24);
    }
  }

  persistSavedOffers();
  renderSaved();
  renderResults();
  renderStorageSummary();
  renderHeaderMeta();
}

function updateHistory(query, resultCount) {
  const now = new Date().toISOString();
  state.history = [
    { query, resultCount, searchedAt: now },
    ...state.history.filter((item) => item.query.toLowerCase() !== query.toLowerCase()),
  ].slice(0, 12);
  persistHistory();
}

function renderAll() {
  syncFilterButtons();
  renderSourceChips();
  renderHeaderMeta();
  renderSummary();
  renderSpotlights();
  renderIssues();
  renderResults();
  renderSaved();
  renderHistory();
  renderStorageSummary();
}

function renderSearchProgress() {
  renderHeaderMeta();
  renderSummary();
  renderSpotlights();
  renderIssues();
  renderResults();
  renderStorageSummary();
}

function renderHeaderMeta() {
  const activeSources = getActiveSources();
  const loadingCount = Object.values(state.sourceStatuses).filter(
    (status) => status.state === "loading"
  ).length;
  const errorCount = Object.values(state.sourceStatuses).filter(
    (status) => status.state === "error"
  ).length;

  const lastScanText = state.searching
    ? loadingCount > 0
      ? `Showing early matches while ${loadingCount} of ${activeSources.length} sources keep scanning for "${state.query}".`
      : `Wrapping up the live scan for "${state.query}"...`
    : state.lastRun?.searchedAt
      ? `Last scan ${formatDateTime(state.lastRun.searchedAt)}. Saved data lives only in this browser.`
      : "No scan yet. Your saved deals live only in this browser.";

  elements.sourceNote.textContent =
    state.searching
      ? `${activeSources.length} live sources active. Fast lanes return first and cached hits can appear immediately.`
      : errorCount > 0
      ? `${activeSources.length} live sources active. ${errorCount} source${errorCount > 1 ? "s" : ""} had issues in the last scan.`
      : `${activeSources.length} live sources active. Domestic, import, and deep-source routes are ranked by final India cost.`;
  elements.lastUpdated.textContent = lastScanText;
  elements.savedCountBadge.textContent = String(state.savedOffers.length);
  elements.fxRateDisplay.textContent = formatFxLine();
  elements.importModeBadge.textContent =
    IMPORT_MODE_DETAILS[state.settings.dutyMode]?.label ?? "Personal buy";
  elements.themeModeLabel.textContent =
    state.theme.charAt(0).toUpperCase() + state.theme.slice(1);
  elements.themeToggle.textContent =
    state.theme === "dark" ? "Light mode" : "Dark mode";
  elements.searchButton.disabled = state.searching;
  elements.searchButton.textContent = state.searching ? "Scanning..." : "Scan prices";
  elements.restoreLastButton.disabled =
    state.searching || !state.lastRun?.results?.length;
  elements.resultCountNote.textContent = state.searching
    ? state.results.length
      ? `${getVisibleResults().length} offers are visible already. Remaining sources are still filling in.`
      : "Fast scan in progress..."
    : state.results.length
      ? `${getVisibleResults().length} visible of ${state.results.length} total offers.`
      : "Run a search to see local versus import opportunities.";
}

function renderSourceChips() {
  elements.sourceToggleList.innerHTML = SOURCE_DEFINITIONS.map((source) => {
    const enabled = state.settings.enabledSources.includes(source.id);
    const status = state.sourceStatuses[source.id] ?? { state: "idle", detail: "" };
    const statusClass = enabled ? `is-${status.state}` : "";
    const statusText = enabled
      ? status.detail || (source.market === "import" ? "Import lane" : "Local lane")
      : "Off";

    return `
      <button
        class="source-chip ${enabled ? "active" : ""} ${statusClass}"
        type="button"
        data-source-id="${escapeAttribute(source.id)}"
        aria-pressed="${enabled ? "true" : "false"}"
      >
        <div class="source-pill">
          <span class="status-dot" aria-hidden="true"></span>
          ${escapeHtml(source.marketLabel)}
        </div>
        <strong>${escapeHtml(source.label)}</strong>
        <span>${escapeHtml(statusText)}</span>
      </button>
    `;
  }).join("");
}

function renderSummary() {
  const bestDomestic = getBestOffer(state.results, "domestic");
  const bestImport = getBestOffer(state.results, "import");
  const bestOverall = getBestOffer(state.results, "all");

  elements.offersCount.textContent = String(state.results.length);
  elements.bestDomestic.textContent = bestDomestic
    ? formatMoney(bestDomestic.landedCostInr, "INR")
    : "-";
  elements.bestImport.textContent = bestImport
    ? formatMoney(bestImport.landedCostInr, "INR")
    : "-";
  elements.bestOverall.textContent = bestOverall
    ? formatMoney(bestOverall.landedCostInr, "INR")
    : "-";
}

function renderSpotlights() {
  const bestDomestic = getBestOffer(state.results, "domestic");
  const bestImport = getBestOffer(state.results, "import");
  const bestOverall = getBestOffer(state.results, "all");

  if (!state.results.length && !state.searching) {
    elements.spotlightGrid.innerHTML = [
      {
        title: "Best India route",
        body: "Local stores will show up here once a product scan finishes.",
      },
      {
        title: "Best import route",
        body: "Imported offers get an India landed-cost estimate before ranking.",
      },
      {
        title: "Overall winner",
        body: "The cheapest final route in INR becomes your top pick here.",
      },
    ]
      .map(
        (card) => `
          <article class="spotlight-card">
            <div class="callout-stack">
              <span class="callout-tag">Waiting</span>
              <h3>${escapeHtml(card.title)}</h3>
              <p>${escapeHtml(card.body)}</p>
            </div>
          </article>
        `
      )
      .join("");
    return;
  }

  elements.spotlightGrid.innerHTML = [
    buildSpotlightCard("Best India route", bestDomestic, "Domestic"),
    buildSpotlightCard("Best import route", bestImport, "Import"),
    buildSpotlightCard("Overall winner", bestOverall, "Overall"),
  ].join("");
}

function renderIssues() {
  const hasIssues = state.errors.length > 0;
  elements.issuesPanel.classList.toggle("hidden", !hasIssues);
  if (!hasIssues) {
    elements.issuesList.innerHTML = "";
    return;
  }

  elements.issuesList.innerHTML = state.errors
    .map(
      (issue) => `
        <article class="issue-card">
          <h3>Source issue</h3>
          <p>${escapeHtml(issue)}</p>
        </article>
      `
    )
    .join("");
}

function buildSpotlightCard(title, offer, badge) {
  if (!offer) {
    return `
      <article class="spotlight-card">
        <div class="callout-stack">
          <span class="callout-tag">${escapeHtml(badge)}</span>
          <h3>${escapeHtml(title)}</h3>
          <p>No matching offer yet.</p>
        </div>
      </article>
    `;
  }

  return `
    <article class="spotlight-card">
      <div class="callout-stack">
        <span class="callout-tag">${escapeHtml(badge)}</span>
        <h3>${escapeHtml(offer.title)}</h3>
        <p>${escapeHtml(offer.sourceLabel)} · ${escapeHtml(offer.marketLabel)}</p>
        <strong class="price-hero">${formatMoney(offer.landedCostInr, "INR")}</strong>
        <div class="callout-meta">
          <span class="callout-tag">Listed ${escapeHtml(offer.listedLabel)}</span>
          ${
            offer.market === "import"
              ? `<span class="callout-tag">Duty ${escapeHtml(
                  offer.dutyRate.toFixed(2)
                )}%</span>`
              : `<span class="callout-tag">Domestic checkout</span>`
          }
        </div>
      </div>
    </article>
  `;
}

function renderResults() {
  const visibleOffers = getVisibleResults();
  const loadingCount = Object.values(state.sourceStatuses).filter(
    (status) => status.state === "loading"
  ).length;

  if (state.searching && !visibleOffers.length) {
    elements.resultsEmpty.classList.add("hidden");
    elements.resultsGrid.innerHTML = Array.from({ length: 4 })
      .map(() => '<article class="loading-card" aria-hidden="true"></article>')
      .join("");
    return;
  }

  elements.resultsEmpty.classList.toggle("hidden", visibleOffers.length > 0);

  if (!visibleOffers.length) {
    elements.resultsGrid.innerHTML = "";
    return;
  }

  const cards = visibleOffers.map(buildOfferCard);
  if (state.searching && loadingCount > 0) {
    cards.push(
      ...Array.from({ length: Math.min(2, loadingCount) }).map(
        () => '<article class="loading-card loading-card-soft" aria-hidden="true"></article>'
      )
    );
  }

  elements.resultsGrid.innerHTML = cards.join("");
}

function buildOfferCard(offer) {
  const isSaved = state.savedOffers.some((item) => item.id === offer.id);
  const deltaLine = buildDeltaLine(offer);

  return `
    <article class="result-card ${escapeAttribute(offer.market)}-card">
      <div class="result-top">
        ${buildImageMarkup(offer.image, offer.sourceLabel)}
        <div class="result-copy">
          <div class="tag-row">
            <span class="offer-tag">${escapeHtml(offer.sourceLabel)}</span>
            <span class="offer-tag">${escapeHtml(offer.marketLabel)}</span>
            ${
              offer.note
                ? `<span class="offer-tag">${escapeHtml(offer.note)}</span>`
                : ""
            }
          </div>
          <h3 class="result-title">${escapeHtml(offer.title)}</h3>
          <p>${escapeHtml(deltaLine)}</p>
        </div>
      </div>

      <div class="price-strip">
        <div class="price-box">
          <span>Listed</span>
          <strong>${escapeHtml(offer.listedLabel)}</strong>
        </div>
        <div class="price-box">
          <span>Landed in India</span>
          <strong class="landed-price">${formatMoney(offer.landedCostInr, "INR")}</strong>
        </div>
      </div>

      <div class="tag-row">
        ${
          offer.market === "import"
            ? `
              <span class="offer-tag">Duty ${escapeHtml(offer.dutyRate.toFixed(2))}%</span>
              <span class="offer-tag">Ship buffer ${escapeHtml(
                state.settings.shippingBufferPercent.toFixed(1)
              )}%</span>
              <span class="offer-tag">FX ${escapeHtml(formatFxLine())}</span>
            `
            : `<span class="offer-tag">No import add-on</span>`
        }
      </div>

      <div class="offer-actions">
        <a
          class="action-link"
          href="${escapeAttribute(offer.url)}"
          target="_blank"
          rel="noreferrer"
        >
          Open offer
        </a>
        <button
          class="action-button ${isSaved ? "is-saved" : ""}"
          type="button"
          data-save-offer="${escapeAttribute(offer.id)}"
        >
          ${isSaved ? "Saved" : "Save deal"}
        </button>
      </div>
    </article>
  `;
}

function renderSaved() {
  if (!state.savedOffers.length) {
    elements.savedGrid.innerHTML =
      '<div class="empty-hint">Saved offers appear here. Keep the best local and import options side by side for later.</div>';
    return;
  }

  const repriced = repriceOffers(state.savedOffers).sort(
    (left, right) => left.landedCostInr - right.landedCostInr
  );
  state.savedOffers = repriced;
  persistSavedOffers();

  elements.savedGrid.innerHTML = repriced
    .map(
      (offer) => `
        <article class="saved-card">
          <div class="saved-head">
            ${buildImageMarkup(offer.image, offer.sourceLabel, true)}
            <div class="saved-copy">
              <div class="tag-row">
                <span class="offer-tag">${escapeHtml(offer.sourceLabel)}</span>
                <span class="offer-tag">${escapeHtml(offer.marketLabel)}</span>
              </div>
              <h3>${escapeHtml(offer.title)}</h3>
              <p>Saved landed cost: ${formatMoney(offer.landedCostInr, "INR")}</p>
            </div>
          </div>
          <div class="offer-actions">
            <a
              class="action-link"
              href="${escapeAttribute(offer.url)}"
              target="_blank"
              rel="noreferrer"
            >
              Reopen
            </a>
            <button
              class="action-button is-saved"
              type="button"
              data-remove-offer="${escapeAttribute(offer.id)}"
            >
              Remove
            </button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderHistory() {
  if (!state.history.length) {
    elements.historyList.innerHTML =
      '<div class="empty-hint">Searches you run are remembered here so you can rerun them in one tap.</div>';
    return;
  }

  elements.historyList.innerHTML = state.history
    .map(
      (entry) => `
        <div class="history-item">
          <div>
            <strong>${escapeHtml(entry.query)}</strong>
            <p>${entry.resultCount} offers · ${formatDateTime(entry.searchedAt)}</p>
          </div>
          <button
            class="ghost-button small-button"
            type="button"
            data-history-query="${escapeAttribute(entry.query)}"
          >
            Search again
          </button>
        </div>
      `
    )
    .join("");
}

function renderStorageSummary() {
  const cachedSourceCount = Object.keys(state.sourceCache).length;
  const items = [
    {
      label: "Saved deals",
      value: String(state.savedOffers.length),
      body: "Pinned offers with their product title, source, URL, and price snapshot.",
    },
    {
      label: "Search history",
      value: String(state.history.length),
      body: "Recent product scans so you can rerun the same hunt quickly.",
    },
    {
      label: "Latest scan",
      value: state.lastRun?.results?.length ? `${state.lastRun.results.length}` : "0",
      body: "Most recent successful result set restored when you revisit the page.",
    },
    {
      label: "Source cache",
      value: String(cachedSourceCount),
      body: "Recent source hits reused when a store is slow or temporarily rate-limited.",
    },
  ];

  elements.storageSummary.innerHTML = items
    .map(
      (item) => `
        <article class="storage-item">
          <div>
            <strong>${escapeHtml(item.label)}</strong>
            <p>${escapeHtml(item.body)}</p>
          </div>
          <strong>${escapeHtml(item.value)}</strong>
        </article>
      `
    )
    .join("");
}

function syncSettingsInputs() {
  elements.modeSelect.value = state.settings.dutyMode;
  elements.customDutyInput.value = String(state.settings.customDutyRate);
  elements.shippingBufferInput.value = String(state.settings.shippingBufferPercent);
  elements.insuranceInput.value = String(state.settings.insurancePercent);
  elements.handlingFeeInput.value = String(state.settings.handlingFeeInr);
  elements.customDutyWrap.classList.toggle(
    "hidden",
    state.settings.dutyMode !== "custom"
  );
  elements.formulaNote.textContent =
    IMPORT_MODE_DETAILS[state.settings.dutyMode]?.formula ??
    IMPORT_MODE_DETAILS.personal.formula;
}

function syncFilterButtons() {
  elements.filterGroup.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.filter);
  });
}

function getVisibleResults() {
  const filtered = state.results.filter((offer) => {
    if (state.filter === "all") {
      return true;
    }
    return offer.market === state.filter;
  });

  return filtered.sort((left, right) => {
    if (state.sort === "listed") {
      return left.basePriceInr - right.basePriceInr;
    }
    if (state.sort === "source") {
      return (
        left.sourceLabel.localeCompare(right.sourceLabel) ||
        left.landedCostInr - right.landedCostInr
      );
    }
    return left.landedCostInr - right.landedCostInr;
  });
}

function getBestOffer(offers, market) {
  const eligible = offers.filter((offer) =>
    market === "all" ? true : offer.market === market
  );
  if (!eligible.length) {
    return null;
  }
  return eligible.reduce((best, current) =>
    current.landedCostInr < best.landedCostInr ? current : best
  );
}

function buildDeltaLine(offer) {
  if (offer.market === "import") {
    if (offer.referenceDeltaInr === null) {
      return "Import estimate includes duty and shipping buffer for India.";
    }
    if (offer.referenceDeltaInr < 0) {
      return `Cheaper than the best India route by ${formatMoney(
        Math.abs(offer.referenceDeltaInr),
        "INR"
      )}.`;
    }
    return `Costs ${formatMoney(
      Math.abs(offer.referenceDeltaInr),
      "INR"
    )} more than the best India route.`;
  }

  if (offer.referenceDeltaInr === null) {
    return "Domestic checkout, no import duty estimate added.";
  }
  if (offer.referenceDeltaInr < 0) {
    return `Cheaper than the best import route by ${formatMoney(
      Math.abs(offer.referenceDeltaInr),
      "INR"
    )}.`;
  }
  return `Safer local buy, but the best import route is ${formatMoney(
    Math.abs(offer.referenceDeltaInr),
    "INR"
  )} cheaper.`;
}

function buildImageMarkup(imageUrl, label, compact = false) {
  const className = compact ? "saved-image" : "result-image";
  if (imageUrl) {
    return `<img class="${className}" src="${escapeAttribute(
      imageUrl
    )}" alt="${escapeAttribute(label)}" loading="lazy" />`;
  }
  return `<div class="image-fallback">${escapeHtml(label)}</div>`;
}

function resetSourceStatuses() {
  state.sourceStatuses = Object.fromEntries(
    SOURCE_DEFINITIONS.map((source) => [
      source.id,
      {
        state: state.settings.enabledSources.includes(source.id) ? "idle" : "off",
        detail: state.settings.enabledSources.includes(source.id) ? "Ready" : "Off",
      },
    ])
  );
}

function setSourceStatus(sourceId, nextState, detail) {
  state.sourceStatuses[sourceId] = {
    state: nextState,
    detail,
  };
  renderSourceChips();
}

function isSearchSessionActive(searchSessionId) {
  return state.searchSessionId === searchSessionId;
}

function getActiveSources() {
  return SOURCE_DEFINITIONS.filter((source) =>
    state.settings.enabledSources.includes(source.id)
  );
}

function hasActiveImportSource() {
  return getActiveSources().some((source) => source.market === "import");
}

function persistSettings() {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
}

function persistSavedOffers() {
  localStorage.setItem(STORAGE_KEYS.savedOffers, JSON.stringify(state.savedOffers));
}

function persistHistory() {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history));
}

function persistLastRun() {
  state.lastRun = {
    query: state.query,
    results: state.results,
    searchedAt: new Date().toISOString(),
    errors: state.errors,
  };
  localStorage.setItem(STORAGE_KEYS.lastRun, JSON.stringify(state.lastRun));
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn(`Unable to read ${key}`, error);
    return fallback;
  }
}

function createOfferId(sourceId, title, price, currency) {
  return `${sourceId}-${slugify(title).slice(0, 56)}-${currency.toLowerCase()}-${String(
    Math.round(price * 100)
  )}`;
}

function slugify(text) {
  return normalizeForMatch(text).replace(/\s+/g, "-");
}

function normalizeForMatch(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function splitTokens(text) {
  return String(text ?? "")
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function looksLikeAccessory(tokens) {
  return tokens.some((token) => ACCESSORY_KEYWORDS.includes(token));
}

function cleanTitle(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function parseNumericPrice(text) {
  return Number(String(text).replace(/,/g, "").trim());
}

function formatMoney(amount, currency) {
  if (!Number.isFinite(amount)) {
    return "-";
  }
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "INR" ? 0 : 2,
  }).format(amount);
}

function formatFxLine() {
  return `1 USD = ${formatNumber(state.exchangeRates.USD)} INR`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.min(Math.max(numeric, min), max);
}

function dedupeOffers(offers) {
  const seen = new Set();
  return offers.filter((offer) => {
    const key = `${offer.sourceId}::${normalizeForMatch(offer.title)}::${offer.price}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildAmazonSearchUrl(query) {
  return `https://www.amazon.in/s?k=${encodeURIComponent(query).replace(/%20/g, "+")}`;
}

function pickAmazonPlainTextTitle(lines, priceLineIndex) {
  let bestCandidate = "";
  let bestScore = -1;
  const startIndex = Math.max(0, priceLineIndex - 12);

  for (let index = startIndex; index < priceLineIndex; index += 1) {
    const candidate = lines[index];
    if (!isLikelyAmazonTitle(candidate)) {
      continue;
    }

    const tokens = splitTokens(normalizeForMatch(candidate));
    let score = 0;
    if (tokens.length >= 2) {
      score += 2;
    }
    if (tokens.length >= 4) {
      score += 1;
    }
    if (candidate.length >= 24) {
      score += 1;
    }
    if (index >= priceLineIndex - 4) {
      score += 1.5;
    }
    if (tokens.some((token) => /\d/.test(token))) {
      score += 0.5;
    }

    if (score > bestScore) {
      bestCandidate = candidate;
      bestScore = score;
    }
  }

  return bestCandidate;
}

function pickAmazonPlainTextPrice(lines, startIndex) {
  for (let index = startIndex; index < Math.min(lines.length, startIndex + 5); index += 1) {
    const match = lines[index].match(/^₹([\d,]+(?:\.\d+)?)/);
    if (match) {
      return parseNumericPrice(match[1]);
    }
  }
  return Number.NaN;
}

function isLikelyAmazonTitle(line) {
  if (!line) {
    return false;
  }

  if (/^₹[\d,]+(?:\.\d+)?$/.test(line) || /^M\.R\.P:/i.test(line)) {
    return false;
  }

  if (
    /^(results|amazon's choice|limited time deal|deal of the day|add to cart|currently unavailable|options|service:|top reviewed|best seller|sponsored)$/i.test(
      line
    )
  ) {
    return false;
  }

  if (
    /^\d+(?:\.\d+)?$/.test(line) ||
    /out of 5 stars/i.test(line) ||
    /bought in past month/i.test(line) ||
    /delivery/i.test(line) ||
    /coupon/i.test(line) ||
    /back with amazon/i.test(line) ||
    /returns?/i.test(line) ||
    /save \d+%/i.test(line)
  ) {
    return false;
  }

  if (!/[a-z]/i.test(line)) {
    return false;
  }

  const tokens = splitTokens(normalizeForMatch(line));
  if (!tokens.length) {
    return false;
  }

  return tokens.length >= 2 || line.length >= 18;
}

function getSourceCacheKey(sourceId, query) {
  return `${sourceId}::${normalizeForMatch(query)}`;
}

function readSourceCache(sourceId, query) {
  const key = getSourceCacheKey(sourceId, query);
  const entry = state.sourceCache[key];
  if (!entry?.updatedAt || !Array.isArray(entry.offers)) {
    return null;
  }

  const isExpired =
    Date.now() - new Date(entry.updatedAt).getTime() > SOURCE_CACHE_TTL_MS;
  if (isExpired) {
    delete state.sourceCache[key];
    persistSourceCache();
    return null;
  }

  return entry.offers.map((offer) => ({ ...offer }));
}

function writeSourceCache(sourceId, query, offers) {
  if (!offers.length) {
    return;
  }

  state.sourceCache[getSourceCacheKey(sourceId, query)] = {
    updatedAt: new Date().toISOString(),
    offers: offers.map((offer) => ({ ...offer })),
  };
  persistSourceCache();
}

function pruneSourceCacheEntries(entries) {
  const validEntries = Object.entries(entries)
    .filter(([, entry]) => {
      if (!entry?.updatedAt || !Array.isArray(entry.offers) || !entry.offers.length) {
        return false;
      }
      return Date.now() - new Date(entry.updatedAt).getTime() <= SOURCE_CACHE_TTL_MS;
    })
    .sort(
      (left, right) =>
        new Date(right[1].updatedAt).getTime() - new Date(left[1].updatedAt).getTime()
    )
    .slice(0, MAX_SOURCE_CACHE_ENTRIES);

  return Object.fromEntries(validEntries);
}

function persistSourceCache() {
  state.sourceCache = pruneSourceCacheEntries(state.sourceCache);
  localStorage.setItem(
    STORAGE_KEYS.sourceCache,
    JSON.stringify({
      version: SOURCE_CACHE_VERSION,
      entries: state.sourceCache,
    })
  );
}

function cleanRetailTitle(title) {
  return cleanTitle(
    String(title ?? "").replace(
      /^(new listing|best seller|in \d+\+ people'?s carts)\s+/i,
      ""
    )
  );
}

function normalizeWalmartUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const redirectedUrl = parsedUrl.searchParams.get("rd");
    return redirectedUrl ? decodeURIComponent(redirectedUrl) : url;
  } catch (error) {
    return url;
  }
}

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
