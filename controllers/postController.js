// controllers/postController.js
const db = require('../config/db');

// 1. READ: Display list of all blog posts in the admin table interface
exports.getAllPosts = async (req, res) => {
    try {
        // Updated to join on author_id and pull category names dynamically
        const [posts] = await db.query(`
            SELECT p.*, u.name AS author, c.name AS category_name 
            FROM posts p 
            JOIN users u ON p.author_id = u.id 
            LEFT JOIN categories c ON p.category_id = c.id 
            ORDER BY p.created_at DESC
        `);
        res.render('admin/posts/index', { posts, success: req.query.success || null, error: req.query.error || null });
    } catch (err) {
        console.error("Fetch Posts Error:", err);
        res.render('admin/posts/index', { posts: [], success: null, error: 'Failed to fetch posts from database.' });
    }
};

// 2. CREATE: Render form page (fetching categories so admins can assign them)
exports.getCreatePost = async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories ORDER BY name ASC');
        res.render('admin/posts/create', { categories, error: null });
    } catch (err) {
        res.render('admin/posts/create', { categories: [], error: 'Failed to load categories.' });
    }
};

// 3. CREATE: Handle form processing submission
exports.postCreatePost = async (req, res) => {
    const { title, summary, content, category_id, status } = req.body;
    const authorId = req.session.userId; // Matches your authenticated admin ID key
    const featured_image = req.file ? `/uploads/posts/${req.file.filename}` : null;
    
    // Set publish_date if explicitly moving straight to 'published' status
    const publish_date = status === 'published' ? new Date() : null;

    try {
        await db.query(
            'INSERT INTO posts (title, content, summary, featured_image, category_id, status, author_id, publish_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, content, summary || null, featured_image, category_id || null, status || 'draft', authorId, publish_date]
        );
        res.redirect('/admin/posts?success=Post created successfully!');
    } catch (err) {
        console.error("Create Post Error:", err);
        // Reload page with categories intact
        const [categories] = await db.query('SELECT * FROM categories ORDER BY name ASC');
        res.render('admin/posts/create', { categories, error: 'Failed to create post.' });
    }
};

// 4. UPDATE: Render pre-filled edit form page
exports.getEditPost = async (req, res) => {
    try {
        const [posts] = await db.query('SELECT * FROM posts WHERE id = ? LIMIT 1', [req.params.id]);
        if (posts.length === 0) return res.redirect('/admin/posts?error=Post not found.');
        
        const [categories] = await db.query('SELECT * FROM categories ORDER BY name ASC');
        res.render('admin/posts/edit', { post: posts[0], categories, error: null });
    } catch (err) {
        res.redirect('/admin/posts?error=Database error loading edit form.');
    }
};

// 5. UPDATE: Handle processing structural edits
exports.postEditPost = async (req, res) => {
    const { title, summary, content, category_id, status } = req.body;
    const postId = req.params.id;
    
    try {
        // Fetch current snapshot to preserve the current image or handle date tracking configurations
        const [posts] = await db.query('SELECT featured_image, status, publish_date FROM posts WHERE id = ?', [postId]);
        if (posts.length === 0) return res.redirect('/admin/posts?error=Post not found.');
        
        let featured_image = posts[0].featured_image;
        if (req.file) {
            featured_image = `/uploads/posts/${req.file.filename}`;
        }

        // If status changes to published for the first time, lock in a date stamp
        let publish_date = posts[0].publish_date;
        if (status === 'published' && !publish_date) {
            publish_date = new Date();
        } else if (status === 'draft') {
            publish_date = null; // Reset date if rolled back to a draft status state
        }

        await db.query(
            'UPDATE posts SET title = ?, content = ?, summary = ?, featured_image = ?, category_id = ?, status = ?, publish_date = ? WHERE id = ?',
            [title, content, summary || null, featured_image, category_id || null, status, publish_date, postId]
        );
        
        res.redirect('/admin/posts?success=Post updated successfully!');
    } catch (err) {
        console.error("Edit Post Error:", err);
        res.redirect(`/admin/posts/edit/${postId}?error=Failed to save updates.`);
    }
};

// 6. UPDATE: Toggle publish switch action button handler
exports.togglePostStatus = async (req, res) => {
    try {
        const [posts] = await db.query('SELECT status, publish_date FROM posts WHERE id = ?', [req.params.id]);
        if (posts.length === 0) return res.redirect('/admin/posts?error=Post not found.');

        const currentStatus = posts[0].status;
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        const publish_date = newStatus === 'published' ? (posts[0].publish_date || new Date()) : null;

        await db.query('UPDATE posts SET status = ?, publish_date = ? WHERE id = ?', [newStatus, publish_date, req.params.id]);
        
        res.redirect('/admin/posts?success=Post status toggled successfully!');
    } catch (err) {
        res.redirect('/admin/posts?error=Failed to switch post status.');
    }
};

// 7. DELETE: Completely remove post
exports.deletePost = async (req, res) => {
    try {
        await db.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
        res.redirect('/admin/posts?success=Post permanently deleted.');
    } catch (err) {
        console.error("Delete Post Error:", err);
        res.redirect('/admin/posts?error=Failed to delete post.');
    }
};