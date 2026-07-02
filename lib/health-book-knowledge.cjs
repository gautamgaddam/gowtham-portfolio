const BOOK_CATEGORIES = [
  { id: "naturopathy", label: "Naturopathy" },
  { id: "bodybuilding", label: "Bodybuilding" },
  { id: "yoga", label: "Yoga" },
];

const DEFAULT_BOOK_CATEGORY = "naturopathy";
const SOURCE_TAG = "books-folder";
const SHARED_LIBRARY_TAG = "health-book-library";

const SUPPORTING_BOOK_TAGS = [
  "nutrition",
  "strength-training",
  "mobility",
  "breathwork",
  "herbal-remedies",
  "recovery",
  "fasting",
  "meditation",
  "hypertrophy",
  "supplements",
];

const CATEGORY_RULES = [
  {
    category: "yoga",
    tags: ["yoga", "mobility", "breathwork", "meditation"],
    needles: ["yoga", "asana", "pranayama", "meditation", "mobility", "surya namaskar"],
  },
  {
    category: "bodybuilding",
    tags: ["bodybuilding", "strength-training", "hypertrophy", "nutrition", "recovery"],
    needles: ["bodybuilding", "muscle", "hypertrophy", "strength", "protein", "training", "workout", "lifting"],
  },
  {
    category: "naturopathy",
    tags: ["naturopathy", "natural-health", "herbal-remedies"],
    needles: ["naturopathy", "natural", "herbal", "remedy", "fasting", "detox", "alkaline", "parasite"],
  },
];

function normalizeTag(tag = "") {
  return String(tag)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseTags(value) {
  const rawTags = Array.isArray(value) ? value : String(value || "").split(",");
  return rawTags.map(normalizeTag).filter(Boolean);
}

function uniqueTags(tags = []) {
  return Array.from(new Set(tags.map(normalizeTag).filter(Boolean)));
}

function normalizeCategory(category = "") {
  const normalized = normalizeTag(category);
  return BOOK_CATEGORIES.some((item) => item.id === normalized)
    ? normalized
    : DEFAULT_BOOK_CATEGORY;
}

function inferBookCategory(...values) {
  const haystack = values.filter(Boolean).join(" ").toLowerCase();
  const match = CATEGORY_RULES.find((rule) =>
    rule.needles.some((needle) => haystack.includes(needle)),
  );
  return match?.category || DEFAULT_BOOK_CATEGORY;
}

function tagsForCategory(category) {
  const normalizedCategory = normalizeCategory(category);
  const rule = CATEGORY_RULES.find((item) => item.category === normalizedCategory);
  return uniqueTags([normalizedCategory, ...(rule?.tags || [])]);
}

function buildBookMetadata({
  title = "",
  author = "",
  fileName = "",
  category,
  tags = [],
  source = "dashboard-upload",
  existingMetadata = {},
} = {}) {
  const parsedTags = parseTags(tags);
  const resolvedCategory = normalizeCategory(
    category || existingMetadata.category || inferBookCategory(title, author, fileName, parsedTags.join(" ")),
  );
  const mergedTags = uniqueTags([
    SHARED_LIBRARY_TAG,
    ...tagsForCategory(resolvedCategory),
    ...parsedTags,
  ]);

  return {
    category: resolvedCategory,
    tags: mergedTags,
    metadata: {
      ...existingMetadata,
      source,
      category: resolvedCategory,
      title,
      author,
      source_note: "Curated health book library context for educational chatbot retrieval.",
      safety_note: "Educational book context only. Do not use as diagnosis, proof, or a reason to stop prescribed care.",
    },
  };
}

function queryCategoryHint(query = "") {
  return inferBookCategory(query);
}

function categoryScoreForResult(result, category) {
  if (!category) return 0;
  const metadata = result?.metadata || {};
  const haystack = [
    metadata.category,
    ...(metadata.tags || []),
    ...(result?.topics || []),
    result?.title,
    result?.content,
  ].filter(Boolean).join(" ").toLowerCase();

  if (metadata.category === category) return 3;
  if (haystack.includes(category)) return 2;
  return 0;
}

function rankHealthBookResults(results = [], query = "") {
  const category = queryCategoryHint(query);
  return [...results].sort((a, b) => {
    const scoreDelta = categoryScoreForResult(b, category) - categoryScoreForResult(a, category);
    if (scoreDelta !== 0) return scoreDelta;
    return (b.similarity || 0) - (a.similarity || 0);
  });
}

module.exports = {
  BOOK_CATEGORIES,
  DEFAULT_BOOK_CATEGORY,
  SHARED_LIBRARY_TAG,
  SOURCE_TAG,
  SUPPORTING_BOOK_TAGS,
  buildBookMetadata,
  inferBookCategory,
  normalizeCategory,
  normalizeTag,
  parseTags,
  rankHealthBookResults,
  tagsForCategory,
  uniqueTags,
};
