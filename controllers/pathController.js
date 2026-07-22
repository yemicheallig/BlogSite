const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const db = require('../config/db')

// =========================================================================
// 1. HOME PAGE
// =========================================================================
exports.index = async (req,res)=>{
  try {
        // 1. Fetch 3 Featured Posts (We will order by publish_date/created_at, and join categories & users)
        // Note: Since 'is_featured' isn't explicitly in your posts schema, we can pull the 3 most recent published posts as our "featured" carousel/grid.
        const [featuredPosts] = await db.query(
            `SELECT p.id, p.title, p.featured_image, p.created_at, c.name AS category_name
             FROM posts p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.status = 'published'
             ORDER BY p.created_at DESC
             LIMIT 3`
        );

        // 2. Fetch 5 Latest Posts
        const [latestPosts] = await db.query(
            `SELECT p.id, p.title, p.featured_image, p.summary AS excerpt, p.created_at, 
                    c.name AS category_name, u.name AS author_name
             FROM posts p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN users u ON p.author_id = u.id
             WHERE p.status = 'published'
             ORDER BY p.created_at DESC
             LIMIT 5`
        );

        // 3. Fetch Categories with their published post counts
        const [categories] = await db.query(
            `SELECT c.name, COUNT(p.id) AS count 
             FROM categories c
             INNER JOIN posts p ON p.category_id = c.id
             WHERE p.status = 'published'
             GROUP BY c.id, c.name
             ORDER BY count DESC`
        );

        // Render the index template inside views/public/
        res.render('public/index', {
            title: 'Blogify - Home',
            activePage: 'home',
            featuredPosts: featuredPosts,
            latestPosts: latestPosts,
            categories: categories
        });

    } catch (error) {
        console.error('Error loading home page:', error);
        res.status(500).send('Internal Server Error');
    }
}

// =========================================================================
// 2. BLOG DIRECTORY & GLOBAL SEARCH
// =========================================================================
exports.blogs = async (req,res)=>{
  try {
        const limit = 6; 
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        
        const selectedCategory = req.query.category || null;
        const searchQuery = req.query.q || null;

        let whereClauses = ["p.status = 'published'"];
        let queryParams = [];

        // Category Filter
        if (selectedCategory) {
            whereClauses.push("c.name = ?");
            queryParams.push(selectedCategory);
        }

        // Search Filter
        if (searchQuery) {
            whereClauses.push("(p.title LIKE ? OR p.content LIKE ? OR c.name LIKE ?)");
            const wildCard = `%${searchQuery}%`;
            queryParams.push(wildCard, wildCard, wildCard);
        }

        const whereSQL = `WHERE ${whereClauses.join(' AND ')}`;

        // Get total posts count for pagination
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total 
             FROM posts p
             LEFT JOIN categories c ON p.category_id = c.id
             ${whereSQL}`,
            queryParams
        );
        const totalPosts = countResult[0].total;
        const totalPages = Math.ceil(totalPosts / limit);

        // Fetch posts for active page
        const postsQuery = `
            SELECT p.id, p.title, p.featured_image, p.summary AS excerpt, p.created_at, 
                   c.name AS category_name, u.name AS author_name
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.author_id = u.id
            ${whereSQL}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const [posts] = await db.query(postsQuery, [...queryParams, limit, offset]);

        // Fetch category list counts
        const [categories] = await db.query(
            `SELECT c.name, COUNT(p.id) AS count 
             FROM categories c
             INNER JOIN posts p ON p.category_id = c.id
             WHERE p.status = 'published'
             GROUP BY c.id, c.name
             ORDER BY count DESC`
        );

        res.render('public/blogs', {
            title: searchQuery ? `Search results for "${searchQuery}"` : 'All Blog Posts',
            activePage: 'blogs',
            posts,
            categories,
            selectedCategory,
            searchQuery,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error('Error in blogs controller:', error);
        res.status(500).send('Internal Server Error');
    }
}

// =========================================================================
// 3. SINGLE POST READER
// =========================================================================
exports.posts = async (req,res)=>{

  try {
        const postId = req.params.id;

        // 1. Fetch current post
        const [posts] = await db.query(
            `SELECT p.*, c.name AS category_name, u.name AS author_name, u.avatar AS author_avatar
             FROM posts p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN users u ON p.author_id = u.id
             WHERE p.id = ? AND p.status = 'published'`,
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).send('Post Not Found');
        }

        const currentPost = posts[0];

        // 2. Reading Time Calculation (avg 200 words per minute)
        const wordCount = currentPost.content.split(/\s+/).length;
        const readingTime = Math.max(1, Math.ceil(wordCount / 200));

        // 3. Get Previous published post (ID smaller than current)
        const [prevResult] = await db.query(
            `SELECT id, title FROM posts WHERE id < ? AND status = 'published' ORDER BY id DESC LIMIT 1`,
            [postId]
        );

        // 4. Get Next published post (ID larger than current)
        const [nextResult] = await db.query(
            `SELECT id, title FROM posts WHERE id > ? AND status = 'published' ORDER BY id ASC LIMIT 1`,
            [postId]
        );

        const currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

        res.render('public/post', {
            title: currentPost.title,
            activePage: 'blogs',
            post: currentPost,
            readingTime: readingTime,
            prevPost: prevResult.length > 0 ? prevResult[0] : null,
            nextPost: nextResult.length > 0 ? nextResult[0] : null,
            currentUrl: currentUrl,

            // Dynamic Meta Tag Injection
            meta: {
                title: `${currentPost.title} | Blogify`,
                description: currentPost.summary || currentPost.content.substring(0, 150).replace(/(<([^>]+)>)/gi, '') + '...',
                image: currentPost.featured_image,
                type: 'article'
            }
        });

    } catch (error) {
        console.error('Error rendering single post:', error);
        res.status(500).send('Internal Server Error');
    }
}

// =========================================================================
// 4. CONTACT PAGE (GET & POST)
// =========================================================================
exports.contact = async (req,res)=>{
    try {
        res.render('public/contact', {
            activePage: 'contact',
            success: req.query.success === 'true',
            formData: {},
            error: null,
            meta: {
            title: 'About Us - Our Story & Mission | Blogify',
            description: 'Learn more about Blogify, our mission, and the engineering team behind our software development blog.'
        }

        });
    } catch (error) {
        console.error('Error in contact GET controller:', error);
        res.status(500).send('Internal Server Error');
    }
}

exports.contactForm = async(req,res)=>{
  try {
        const { name, email, subject, message } = req.body;
        const formData = { name, email, subject, message };

        // Basic Server-Side Validation Rules
        if (!name || name.trim() === '' || 
            !email || email.trim() === '' || 
            !subject || subject.trim() === '' || 
            !message || message.trim() === '') {
                return res.status(400).render('public/contact', {
                  activePage: 'contact',
                    success: false,
                    error: 'All fields are required.',
                    formData,
                    meta: { title: 'Contact Us | Blogify' }
            });  
       }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).render('public/contact', {
                activePage: 'contact',
                success: false,
                error: 'Please enter a valid email address.',
                formData,
                meta: { title: 'Contact Us | Blogify' }
            });        }

        // Write to contact_messages table matching your exact database schema
        await db.query(
            `INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)`,
            [name.trim(), email.trim(), subject.trim(), message.trim()]
        );

        // Redirect back with success message flag
        res.redirect('/contact?success=true');

    } catch (error) {
        console.error('Error saving contact message:', error);
        res.status(500).render('public/contact', {
            activePage: 'contact',
            success: false,
            error: 'Something went wrong on our end. Please try again later.',
            formData,
            meta: { title: 'Contact Us | Blogify' }
        });
    }
}

// =========================================================================
// 5. ABOUT US PAGE
// =========================================================================
exports.about = async(req,res) =>{
  try {
        res.render('public/about', {
            title: 'About Us - Blogify',
            activePage: 'about'
        });
        console.log('Hello')
    } catch (error) {
        console.error('Error in aboutUs controller:', error);
        res.status(500).send('Internal Server Error');
    }
}

// =========================================================================
// 6.  SEARCH PAGE
// =========================================================================
// Dedicated Search Page
exports.searchPage = async (req, res) => {
    try {
        const searchQuery = req.query.q || null;

        if (!searchQuery) {
            // Render clean template with empty states if no query provided
            return res.render('public/search', {
                activePage: 'search',
                posts: [],
                searchQuery: null,
                meta: {
            title: searchQuery ? `Search: "${searchQuery}" | Blogify` : 'Search Articles | Blogify',
            description: `Search results for ${searchQuery || 'articles and tutorials on Blogify'}.`
        }
            });
        }

        // Run query checking against Title, Content, and Category matching schema constraints
        const [posts] = await db.query(
            `SELECT p.id, p.title, p.featured_image, p.summary AS excerpt, p.created_at, 
                    c.name AS category_name, u.name AS author_name
             FROM posts p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN users u ON p.author_id = u.id
             WHERE p.status = 'published' AND (p.title LIKE ? OR p.content LIKE ? OR c.name LIKE ?)
             ORDER BY p.created_at DESC`,
            [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`]
        );

        res.render('public/search', {
            title: `Search results for "${searchQuery}"`,
            activePage: 'search',
            posts,
            searchQuery
        });
    } catch (error) {
        console.error('Error inside search controller:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.getSitemap = async (req, res) => {
    try {
        const [posts] = await db.query(
            "SELECT id, updated_at FROM posts WHERE status = 'published' ORDER BY updated_at DESC"
        );

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemapindices.org/schemas/sitemap/0.9">\n`;

        // Static Pages
        xml += `  <url><loc>https://blogify.com/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
        xml += `  <url><loc>https://blogify.com/about</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;
        xml += `  <url><loc>https://blogify.com/blogs</loc><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;

        // Dynamic Post Pages
        posts.forEach(post => {
            const date = new Date(post.updated_at).toISOString();
            xml += `  <url>\n`;
            xml += `    <loc>https://blogify.com/post/${post.id}</loc>\n`;
            xml += `    <lastmod>${date}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.7</priority>\n`;
            xml += `  </url>\n`;
        });

        xml += `</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (error) {
        console.error('Error generating sitemap:', error);
        res.status(500).end();
    }
};