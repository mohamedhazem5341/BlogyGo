let allTopics = [];
let allCategories = [];
let currentFilter = "all";

// Initialize page
document.addEventListener("DOMContentLoaded", initializeCategoriesPage);

async function initializeCategoriesPage() {
  // Get filter from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get("filter");

  if (filterParam) {
    currentFilter = filterParam;
  }

  showLoading();

  try {
    const data = await API.get("/api/data");
    allTopics = data.topics || [];
    allCategories = data.categories || [];

    renderCategoryButtons();
    renderTopics();
  } catch (error) {
    handleError(error, "Failed to load categories and topics");
    showEmptyState();
  } finally {
    hideLoading();
  }
}

function renderCategoryButtons() {
  const container = document.getElementById("category-buttons");

  // Clear existing buttons except "All Topics"
  container.innerHTML = `
                <button class="category-btn ${
                  currentFilter === "all" ? "active" : ""
                }" data-category="all">All Topics</button>
            `;

  // Add category buttons
  allCategories.forEach((category) => {
    const button = document.createElement("button");
    button.className = `category-btn ${
      currentFilter === category ? "active" : ""
    }`;
    button.setAttribute("data-category", category);
    button.textContent = category;
    container.appendChild(button);
  });

  // Add click event listeners
  container.addEventListener("click", handleCategoryFilter);
}

function handleCategoryFilter(event) {
  if (event.target.classList.contains("category-btn")) {
    const category = event.target.getAttribute("data-category");

    // Update active button
    document.querySelectorAll(".category-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    event.target.classList.add("active");

    // Update filter and render topics
    currentFilter = category;
    renderTopics();

    // Update URL without refreshing page
    const newUrl =
      category === "all"
        ? "/categories"
        : `/categories?filter=${encodeURIComponent(category)}`;
    window.history.pushState({}, "", newUrl);
  }
}

function renderTopics() {
  const container = document.getElementById("topics-container");
  let filteredTopics;

  if (currentFilter === "all") {
    filteredTopics = allTopics;
  } else {
    filteredTopics = allTopics.filter(
      (topic) => topic.category === currentFilter
    );
  }

  if (filteredTopics.length === 0) {
    showEmptyState();
    return;
  }

  hideEmptyState();

  // Sort topics by creation date (newest first)
  filteredTopics.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  container.innerHTML = filteredTopics
    .map(
      (topic) => `
                <article class="post-card">
                    <div class="post-header">
                        <h3><a href="/topic/${
                          topic.slug || topic.id
                        }">${escapeHtml(topic.title)}</a></h3>
                        <span class="category-tag">${escapeHtml(
                          topic.category
                        )}</span>
                    </div>
                    <div class="post-excerpt">
                        ${escapeHtml(
                          stripHtmlTags(topic.content).substring(0, 200)
                        )}${
        stripHtmlTags(topic.content).length > 200 ? "..." : ""
      }
                    </div>
                    <div class="post-meta">
                        <span class="date">${formatDate(topic.createdAt)}</span>
                    </div>
                </article>
            `
    )
    .join("");
}

function showLoading() {
  document.getElementById("loading-topics").style.display = "block";
  document.getElementById("topics-container").style.display = "none";
  document.getElementById("empty-topics").style.display = "none";
}

function hideLoading() {
  document.getElementById("loading-topics").style.display = "none";
  document.getElementById("topics-container").style.display = "grid";
}

function showEmptyState() {
  document.getElementById("empty-topics").style.display = "block";
  document.getElementById("topics-container").style.display = "none";
}

function hideEmptyState() {
  document.getElementById("empty-topics").style.display = "none";
  document.getElementById("topics-container").style.display = "grid";
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Format date helper (already in main.js but redefined for clarity)
function formatDate(dateString) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString("en-US", options);
}

// Utility function to strip HTML tags for excerpts
function stripHtmlTags(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}
