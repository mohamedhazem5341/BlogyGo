let currentData = { categories: [], topics: [] };

// Initialize admin panel
document.addEventListener("DOMContentLoaded", initializeAdminPanel);

async function initializeAdminPanel() {
  await loadData();
  setupEventListeners();
  updateStats();
  initializeTinyMCE();
}

function initializeTinyMCE() {
  tinymce.init({
    selector: "#topic-content",
    height: 400,
    menubar: false,
    relative_urls: false,
    remove_script_host: false,
    document_base_url: window.location.origin + "/",
    plugins: [
      "advlist",
      "autolink",
      "lists",
      "link",
      "image",
      "charmap",
      "preview",
      "anchor",
      "searchreplace",
      "visualblocks",
      "code",
      "fullscreen",
      "insertdatetime",
      "media",
      "table",
      "help",
      "wordcount",
    ],
    toolbar:
      "undo redo | blocks | " +
      "bold italic forecolor | alignleft aligncenter " +
      "alignright alignjustify | bullist numlist outdent indent | " +
      "removeformat | image link | help",
    content_style:
      "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
    images_upload_handler: function (blobInfo, success, failure) {
      // Create form data for file upload
      const formData = new FormData();
      formData.append("image", blobInfo.blob(), blobInfo.filename());

      // Upload to server
      fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            console.log("Image uploaded successfully:", data.imageUrl);
            success(data.imageUrl);
          } else {
            failure(data.error || "Upload failed");
          }
        })
        .catch((error) => {
          console.error("Upload error:", error);
          failure("Network error during upload");
        });
    },
    automatic_uploads: false,
    file_picker_types: "image",
    file_picker_callback: function (callback, value, meta) {
      if (meta.filetype === "image") {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/*");

        input.onchange = function () {
          const file = this.files[0];

          // Upload file to server
          const formData = new FormData();
          formData.append("image", file);

          fetch("/api/upload-image", {
            method: "POST",
            body: formData,
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.success) {
                console.log("File picker upload successful:", data.imageUrl);
                callback(data.imageUrl, {
                  alt: file.name,
                });
              } else {
                alert("Upload failed: " + (data.error || "Unknown error"));
              }
            })
            .catch((error) => {
              console.error("Upload error:", error);
              alert("Network error during upload");
            });
        };

        input.click();
      }
    },
  });
}

async function loadData() {
  try {
    const data = await API.get("/api/data");
    currentData = data;
    updateCategorySelect();
    displayCurrentCategories();
    displayCurrentTopics();
  } catch (error) {
    handleError(error, "Failed to load data");
  }
}

function setupEventListeners() {
  // Topic form submission
  document
    .getElementById("topic-form")
    .addEventListener("submit", handleTopicSubmission);

  // Category form submission
  document
    .getElementById("category-form")
    .addEventListener("submit", handleCategorySubmission);
}

async function handleTopicSubmission(event) {
  event.preventDefault();

  // Get content from TinyMCE editor
  const content = tinymce.get("topic-content").getContent();

  const formData = new FormData(event.target);
  const topicData = {
    title: formData.get("title").trim(),
    content: content.trim(),
    category: formData.get("category"),
  };

  // Client-side validation
  try {
    Validation.required(topicData.title, "Title");
    Validation.minLength(topicData.title, 3, "Title");
    Validation.maxLength(topicData.title, 200, "Title");

    Validation.required(topicData.content, "Content");
    Validation.minLength(
      topicData.content.replace(/<[^>]*>/g, ""),
      10,
      "Content"
    ); // Strip HTML for length check

    Validation.required(topicData.category, "Category");

    // *** CONTENT SIZE CONFIG: Change this value to modify content limits ***
    // Check for overly large content (now much smaller since images are file references)
    if (topicData.content.length > 500000) {
      // *** CHANGE THIS: 500KB limit for HTML content - modify this number ***
      throw new Error("Content is too large. Please reduce text content.");
    }
  } catch (error) {
    handleError(error);
    return;
  }

  const submitBtn = event.target.querySelector('button[type="submit"]');
  setLoadingState(submitBtn);

  try {
    const result = await API.post("/api/topics", topicData);
    handleSuccess("Topic created successfully!");
    resetTopicForm();
    await loadData(); // Reload data to update stats
    updateStats();
  } catch (error) {
    handleError(error, "Failed to create topic");
  } finally {
    setLoadingState(submitBtn, false);
  }
}

async function handleCategorySubmission(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const categoryData = {
    name: formData.get("name").trim(),
  };

  // Client-side validation
  try {
    Validation.required(categoryData.name, "Category name");
    Validation.minLength(categoryData.name, 2, "Category name");
    Validation.maxLength(categoryData.name, 50, "Category name");

    // Check if category already exists
    if (currentData.categories.includes(categoryData.name)) {
      throw new Error("Category already exists");
    }
  } catch (error) {
    handleError(error);
    return;
  }

  const submitBtn = event.target.querySelector('button[type="submit"]');
  setLoadingState(submitBtn);

  try {
    const result = await API.post("/api/categories", categoryData);
    handleSuccess("Category added successfully!");
    resetCategoryForm();
    await loadData(); // Reload data to update categories
    updateStats();
  } catch (error) {
    handleError(error, "Failed to add category");
  } finally {
    setLoadingState(submitBtn, false);
  }
}

function updateCategorySelect() {
  const select = document.getElementById("topic-category");

  // Clear existing options except the first one
  select.innerHTML = '<option value="">Select a category</option>';

  // Add category options
  currentData.categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
}

function displayCurrentCategories() {
  const container = document.getElementById("current-categories");

  if (currentData.categories.length === 0) {
    container.innerHTML = '<p class="empty-state">No categories yet.</p>';
    return;
  }

  container.innerHTML = currentData.categories
    .map(
      (category) => `
                <div class="category-item" style="margin: 0.25rem 0; padding: 0.5rem; background: #f8f9fa; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <span class="category-tag">${category}</span>
                    <button class="btn-delete" onclick="confirmDeleteCategory('${category}')" style="background: #e74c3c; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.8rem; cursor: pointer;">Delete</button>
                </div>
            `
    )
    .join("");
}

function displayCurrentTopics() {
  const container = document.getElementById("current-topics");

  if (currentData.topics.length === 0) {
    container.innerHTML = '<p class="empty-state">No topics yet.</p>';
    return;
  }

  // Sort topics by creation date (newest first)
  const sortedTopics = [...currentData.topics].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  container.innerHTML = sortedTopics
    .map(
      (topic) => `
                <div class="topic-item" style="margin: 0.5rem 0; padding: 1rem; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #3498db;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <h5 style="margin: 0 0 0.5rem 0; color: #2c3e50;">${
                              topic.title
                            }</h5>
                            <div style="display: flex; gap: 1rem; font-size: 0.9rem; color: #7f8c8d;">
                                <span class="category-tag" style="background: #3498db;">${
                                  topic.category
                                }</span>
                                <span>${new Date(
                                  topic.createdAt
                                ).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <button class="btn-delete" onclick="confirmDeleteTopic('${
                          topic.id
                        }', '${topic.title.replace(
        /'/g,
        "\\'"
      )}'); " style="background: #e74c3c; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.8rem; cursor: pointer;">Delete</button>
                    </div>
                </div>
            `
    )
    .join("");
}

function updateStats() {
  const totalTopics = currentData.topics.length;
  const totalCategories = currentData.categories.length;

  // Calculate topics from this month
  const thisMonth = new Date();
  thisMonth.setDate(1); // First day of current month
  const recentTopics = currentData.topics.filter(
    (topic) => new Date(topic.createdAt) >= thisMonth
  ).length;

  document.getElementById("total-topics").textContent = totalTopics;
  document.getElementById("total-categories").textContent = totalCategories;
  document.getElementById("recent-topics").textContent = recentTopics;
}

function resetTopicForm() {
  const form = document.getElementById("topic-form");
  form.reset();
  // Reset TinyMCE editor
  tinymce.get("topic-content").setContent("Write your topic content here...");
}

function resetCategoryForm() {
  const form = document.getElementById("category-form");
  form.reset();
}

// Delete confirmation functions
function confirmDeleteCategory(categoryName) {
  if (
    confirm(
      `Are you sure you want to delete the category "${categoryName}"?\n\nThis action cannot be undone. If any topics are using this category, deletion will be prevented.`
    )
  ) {
    deleteCategory(categoryName);
  }
}

function confirmDeleteTopic(topicId, topicTitle) {
  if (
    confirm(
      `Are you sure you want to delete the topic "${topicTitle}"?\n\nThis action cannot be undone and will permanently remove the topic and all its content.`
    )
  ) {
    deleteTopic(topicId);
  }
}

// Delete functions
async function deleteCategory(categoryName) {
  try {
    const result = await API.delete(
      `/api/categories/${encodeURIComponent(categoryName)}`
    );
    handleSuccess(result.message);
    await loadData(); // Reload data to refresh display
    updateStats();
  } catch (error) {
    handleError(error, "Failed to delete category");
  }
}

async function deleteTopic(topicId) {
  try {
    const result = await API.delete(`/api/topics/${topicId}`);
    handleSuccess(result.message);
    await loadData(); // Reload data to refresh display
    updateStats();
  } catch (error) {
    handleError(error, "Failed to delete topic");
  }
}

// Add some additional styles for better UX
const additionalStyles = `
            .category-list, .topics-list {
                min-height: 50px;
                border: 2px dashed #ddd;
                padding: 1rem;
                border-radius: 4px;
                background-color: #f9f9f9;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .category-list .empty-state, .topics-list .empty-state {
                color: #999;
                font-style: italic;
                text-align: center;
                margin: 0;
            }

            .btn-delete:hover {
                background: #c0392b !important;
                transform: scale(1.05);
                transition: all 0.2s ease;
            }

            .category-item:hover, .topic-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
            }

            .admin-grid {
                grid-template-columns: 1fr 1fr 1fr;
            }

            @media (max-width: 1200px) {
                .admin-grid {
                    grid-template-columns: 1fr 1fr;
                }
            }

            @media (max-width: 768px) {
                .admin-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;

// Inject additional styles
const styleSheet = document.createElement("style");
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
