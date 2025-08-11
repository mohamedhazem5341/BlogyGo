const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// *** SIZE LIMIT CONFIG: Change these values to modify request size limits ***
app.use(express.json({ limit: '100mb' })); // JSON payload limit - change '100mb' to increase
app.use(express.urlencoded({ extended: true, limit: '100mb' })); // Form data limit - change '100mb' to increase
app.use(express.static('public'));
app.use('/posts', express.static('posts'));

// Utility function to ensure data files exist
function ensureDataFiles() {
    const categoriesFile = 'categories.json';
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Create categories.json if it doesn't exist
    if (!fs.existsSync(categoriesFile)) {
        const initialCategories = {
            categories: ['General', 'Technology', 'Lifestyle'],
            topics: []
        };
        fs.writeFileSync(categoriesFile, JSON.stringify(initialCategories, null, 2));
    }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, 'public', 'uploads');
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'img-' + uniqueSuffix + ext);
    }
});

// *** IMAGE UPLOAD SIZE CONFIG: Change fileSize value to modify image upload limits ***
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // *** CHANGE THIS: 20MB per image limit - modify number before * 1024 * 1024 ***
    },
    fileFilter: function (req, file, cb) {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Initialize data files on startup
ensureDataFiles();

// Routes

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Categories page
app.get('/categories', (req, res) => {
    res.sendFile(path.join(__dirname, 'posts', 'categories.html'));
});

// Admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'posts', 'admin.html'));
});

// API endpoint to get all categories and topics
app.get('/api/data', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync('categories.json', 'utf8'));
        res.json(data);
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: 'Failed to load data' });
    }
});

// API endpoint to add new category
app.post('/api/categories', (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const data = JSON.parse(fs.readFileSync('categories.json', 'utf8'));
        
        // Check if category already exists
        if (data.categories.includes(name.trim())) {
            return res.status(400).json({ error: 'Category already exists' });
        }

        data.categories.push(name.trim());
        fs.writeFileSync('categories.json', JSON.stringify(data, null, 2));
        
        res.json({ success: true, message: 'Category added successfully' });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ error: 'Failed to add category' });
    }
});

// API endpoint to add new topic
app.post('/api/topics', (req, res) => {
    try {
        const { title, content, category } = req.body;
        
        if (!title || !content || !category) {
            return res.status(400).json({ error: 'Title, content, and category are required' });
        }

        // *** TOPIC CONTENT SIZE CONFIG: Change this value to modify topic content limits ***
        // Validate content size (much smaller now since images are file references)
        if (content.length > 500000) { // *** CHANGE THIS: 500KB limit for HTML content - modify this number ***
            return res.status(400).json({ error: 'Content is too large. Please reduce text content.' });
        }

        const data = JSON.parse(fs.readFileSync('categories.json', 'utf8'));
        
        // Check if category exists
        if (!data.categories.includes(category)) {
            return res.status(400).json({ error: 'Selected category does not exist' });
        }

        const newTopic = {
            id: Date.now().toString(),
            title: title.trim(),
            content: content.trim(),
            category: category,
            createdAt: new Date().toISOString(),
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        };

        data.topics.push(newTopic);
        fs.writeFileSync('categories.json', JSON.stringify(data, null, 2));
        
        res.json({ success: true, message: 'Topic added successfully', topic: newTopic });
    } catch (error) {
        console.error('Error adding topic:', error);
        
        // More specific error handling
        if (error.message && error.message.includes('JSON')) {
            res.status(400).json({ error: 'Invalid content format. Please try again without special characters.' });
        } else if (error.code === 'ENOSPC') {
            res.status(500).json({ error: 'Not enough storage space. Please reduce content size.' });
        } else {
            res.status(500).json({ error: 'Failed to add topic. Please try again.' });
        }
    }
});

// API endpoint to upload images
app.post('/api/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Return the URL path to the uploaded image
        const imageUrl = `/uploads/${req.file.filename}`;
        
        res.json({ 
            success: true, 
            imageUrl: imageUrl,
            message: 'Image uploaded successfully'
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// API endpoint to get specific topic
app.get('/api/topics/:id', (req, res) => {
    try {
        const { id } = req.params;
        const data = JSON.parse(fs.readFileSync('categories.json', 'utf8'));
        
        const topic = data.topics.find(t => t.id === id || t.slug === id);
        
        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        
        res.json(topic);
    } catch (error) {
        console.error('Error getting topic:', error);
        res.status(500).json({ error: 'Failed to load topic' });
    }
});

// API endpoint to delete topic
app.delete('/api/topics/:id', (req, res) => {
    try {
        const { id } = req.params;
        const data = JSON.parse(fs.readFileSync('categories.json', 'utf8'));
        
        const topicIndex = data.topics.findIndex(t => t.id === id);
        
        if (topicIndex === -1) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        
        const deletedTopic = data.topics.splice(topicIndex, 1)[0];
        fs.writeFileSync('categories.json', JSON.stringify(data, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Topic deleted successfully',
            deletedTopic: deletedTopic
        });
    } catch (error) {
        console.error('Error deleting topic:', error);
        res.status(500).json({ error: 'Failed to delete topic' });
    }
});

// API endpoint to delete category
app.delete('/api/categories/:name', (req, res) => {
    try {
        const categoryName = decodeURIComponent(req.params.name);
        const data = JSON.parse(fs.readFileSync('categories.json', 'utf8'));
        
        const categoryIndex = data.categories.indexOf(categoryName);
        
        if (categoryIndex === -1) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        // Check if any topics use this category
        const topicsUsingCategory = data.topics.filter(t => t.category === categoryName);
        
        if (topicsUsingCategory.length > 0) {
            return res.status(400).json({ 
                error: `Cannot delete category "${categoryName}". ${topicsUsingCategory.length} topic(s) are using this category.`,
                topicsCount: topicsUsingCategory.length
            });
        }
        
        data.categories.splice(categoryIndex, 1);
        fs.writeFileSync('categories.json', JSON.stringify(data, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Category deleted successfully',
            deletedCategory: categoryName
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// Dynamic topic page route
app.get('/topic/:id', (req, res) => {
    try {
        const { id } = req.params;
        const data = JSON.parse(fs.readFileSync('categories.json', 'utf8'));
        
        const topic = data.topics.find(t => t.id === id || t.slug === id);
        
        if (!topic) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Topic Not Found</title>
                    <link rel="stylesheet" href="/style.css">
                </head>
                <body>
                    <nav class="navbar">
                        <div class="nav-container">
                            <h1><a href="/">My Blog</a></h1>
                            <ul class="nav-menu">
                                <li><a href="/">Home</a></li>
                                <li><a href="/categories">Categories</a></li>
                                <li><a href="/admin">Admin</a></li>
                            </ul>
                        </div>
                    </nav>
                    <div class="container">
                        <div class="error-page">
                            <h2>Topic Not Found</h2>
                            <p>The requested topic does not exist.</p>
                            <a href="/categories" class="btn btn-primary">Browse Topics</a>
                        </div>
                    </div>
                </body>
                </html>
            `);
        }
        
        const topicHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${topic.title} - My Blog</title>
                <link rel="stylesheet" href="/style.css">
            </head>
            <body>
                <nav class="navbar">
                    <div class="nav-container">
                        <h1><a href="/">My Blog</a></h1>
                        <ul class="nav-menu">
                            <li><a href="/">Home</a></li>
                            <li><a href="/categories">Categories</a></li>
                            <li><a href="/admin">Admin</a></li>
                        </ul>
                    </div>
                </nav>
                
                <div class="container">
                    <article class="topic-article">
                        <header class="topic-header">
                            <h1>${topic.title}</h1>
                            <div class="topic-meta">
                                <span class="category-tag">${topic.category}</span>
                                <span class="date">${new Date(topic.createdAt).toLocaleDateString()}</span>
                            </div>
                        </header>
                        
                        <div class="topic-content">
                            ${topic.content}
                        </div>
                        
                        <footer class="topic-footer">
                            <a href="/categories" class="btn btn-secondary">← Back to Categories</a>
                        </footer>
                    </article>
                </div>
            </body>
            </html>
        `;
        
        res.send(topicHtml);
    } catch (error) {
        console.error('Error loading topic page:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start server
app.listen(5000, 'localhost', () => {
  console.log('Server running on http://localhost:5000');
});
