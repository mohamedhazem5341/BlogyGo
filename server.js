const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/posts', express.static('posts'));

// Utility function to ensure data files exist
function ensureDataFiles() {
    const categoriesFile = 'categories.json';
    
    // Create categories.json if it doesn't exist
    if (!fs.existsSync(categoriesFile)) {
        const initialCategories = {
            categories: ['General', 'Technology', 'Lifestyle'],
            topics: []
        };
        fs.writeFileSync(categoriesFile, JSON.stringify(initialCategories, null, 2));
    }
}

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
        res.status(500).json({ error: 'Failed to add topic' });
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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
