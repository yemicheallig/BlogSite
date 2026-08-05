const db = require('./db');

const schemas = [
  `CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
  ) ENGINE=InnoDB;`,

  `INSERT IGNORE INTO categories (name) VALUES 
('Household Economics'),
('Economy and Public Policy'),
('Money & Investment'),
('Climate and Green Economy'),
('Tourism & Creative Economy'),
('Diaspora & Global Ethiopia'),
('Economixgna Studio');`,

  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    role VARCHAR(50) DEFAULT 'visitor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;`,

  `CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    summary TEXT DEFAULT NULL,
    featured_image VARCHAR(255) DEFAULT NULL,
    category_id INT DEFAULT NULL,
    status ENUM('draft', 'published') DEFAULT 'draft',
    author_id INT NOT NULL,
    publish_date TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB;`,

  `CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(191) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;`,

  `INSERT IGNORE INTO posts (id, title, content, summary, featured_image, category_id, status, author_id, publish_date) VALUES
(1, 'Managing Family Budgets During Inflationary Periods', 'Inflation impacts everyday household purchasing power. To mitigate rising costs, families can focus on auditing fixed monthly expenses, substituting non-essential imported goods with local produce, and establishing emergency funds in yield-bearing accounts.', 'Practical strategies for family budget management amidst rising inflation.', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c', (SELECT id FROM categories WHERE name = 'Household Economics'), 'published', 1, NOW()),
(2, 'Smart Grocery Shopping: Navigating Urban Food Markets', 'Urban food expenses form a large share of monthly household expenditure. Bulk purchasing community cooperatives and tracking seasonal price variations are effective ways to reduce food budgets by up to 20%.', 'How urban households can optimize food expenditures through smart buying.', 'https://images.unsplash.com/photo-1542838132-92c53300491e', (SELECT id FROM categories WHERE name = 'Household Economics'), 'published', 1, NOW()),
(3, 'Teaching Financial Literacy to Children at Home', 'Building lifelong financial habits begins in the home. Parents can introduce early concepts of savings, opportunity cost, and goal setting through allowance management and interactive family budget discussions.', 'A guide for parents on instilling early financial concepts in children.', 'https://images.unsplash.com/photo-1577896851231-70ef18881754', (SELECT id FROM categories WHERE name = 'Household Economics'), 'published', 1, NOW()),
(4, 'Macroeconomic Outlook: Fiscal Reforms and Industrial Growth', 'Recent fiscal policy adjustments aim to boost export competitiveness and improve industrial production. Sustained public infrastructure investment remains crucial for long-term GDP growth.', 'An analysis of macroeconomic shifts and industrial sector potential.', 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e', (SELECT id FROM categories WHERE name = 'Economy and Public Policy'), 'published', 1, NOW()),
(5, 'Evaluating Public Infrastructure Projects and Return on Investment', 'Large-scale public transit and logistical expansion projects require rigorous cost-benefit analyses. This paper evaluates regional transport infrastructure and its long-term impact on local trade corridors.', 'Measuring economic returns on national infrastructure investments.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab', (SELECT id FROM categories WHERE name = 'Economy and Public Policy'), 'published', 1, NOW()),
(6, 'The Role of Micro-Finance Institutions in Economic Inclusion', 'Micro-finance organizations bridge the gap for small agricultural producers and urban micro-entrepreneurs who lack traditional banking access. Strengthening regulatory frameworks enhances capital liquidity.', 'How micro-finance institutions expand financial access across local sectors.', 'https://images.unsplash.com/photo-1450133064473-71024230f91b', (SELECT id FROM categories WHERE name = 'Economy and Public Policy'), 'published', 1, NOW()),
(7, 'Understanding Local Equity Markets: A Beginner Guide', 'Entering stock and bond markets requires understanding price-to-earnings ratios, dividend yields, and risk diversification. Beginners should prioritize long-term asset allocation strategies.', 'Essential concepts for starting out in local equity and bond markets.', 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f', (SELECT id FROM categories WHERE name = 'Money & Investment'), 'published', 1, NOW()),
(8, 'Real Estate vs. Treasury Bills: Evaluating Asset Returns', 'Comparing illiquid commercial real estate investments with fixed-income treasury yields reveals distinct risk-return profiles depending on market cycles and prevailing interest rates.', 'An evaluation of capital growth in real estate versus debt securities.', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa', (SELECT id FROM categories WHERE name = 'Money & Investment'), 'published', 1, NOW()),
(9, 'Risk Management Strategies for Individual Portfolios', 'Diversification across asset classes prevents capital destruction during market drawdowns. Rebalancing equity and debt allocations periodically locks in gains and limits downside exposure.', 'Key principles for mitigating portfolio risk and capital loss.', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3', (SELECT id FROM categories WHERE name = 'Money & Investment'), 'published', 1, NOW()),
(10, 'Renewable Energy Integration and Grid Expansion', 'Scaling solar and hydroelectric capacity provides cleaner power while expanding energy access. Modernizing distribution grids reduces operational transmission losses.', 'Examining renewable energy development and grid modernization.', 'https://images.unsplash.com/photo-1466611653911-95081537e5b7', (SELECT id FROM categories WHERE name = 'Climate and Green Economy'), 'published', 1, NOW()),
(11, 'Sustainable Agriculture and Climate-Resilient Crops', 'Adopting drought-resistant crop varieties and soil conservation practices secures agricultural yields against volatile weather patterns, protecting rural producer incomes.', 'Innovative agricultural methods adapting to changing climate realities.', 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854', (SELECT id FROM categories WHERE name = 'Climate and Green Economy'), 'published', 1, NOW()),
(12, 'Green Bonds and Financing Sustainable Infrastructure', 'Green bond issuances offer institutional capital a structured pathway to fund environmental remediation, clean water projects, and low-carbon urban development.', 'How green bonds finance sustainable urban and environmental development.', 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9', (SELECT id FROM categories WHERE name = 'Climate and Green Economy'), 'published', 1, NOW()),
(13, 'Eco-Tourism Development in Heritage Destinations', 'Eco-tourism preserves natural reserves while creating sustainable employment for local host communities. Expanding boutique hospitality infrastructure attracts high-value international visitors.', 'Leveraging sustainable travel to preserve cultural and natural sites.', 'https://images.unsplash.com/photo-1488646953014-85cb44e25828', (SELECT id FROM categories WHERE name = 'Tourism & Creative Economy'), 'published', 1, NOW()),
(14, 'Monetizing Cultural Assets and Creative Industries', 'Film, visual arts, and music export industries generate substantial foreign revenues when protected by robust intellectual property laws and modern digital distribution channels.', 'Building sustainable revenue models for local artists and creators.', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4', (SELECT id FROM categories WHERE name = 'Tourism & Creative Economy'), 'published', 1, NOW()),
(15, 'Culinary Tourism: Positioning Local Gastronomy Globally', 'Authentic food traditions serve as powerful cultural ambassadors. Promoting culinary destinations boosts restaurant ecosystems, agricultural supply chains, and hospitality revenue.', 'How local food heritage drives growth in the hospitality sector.', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836', (SELECT id FROM categories WHERE name = 'Tourism & Creative Economy'), 'published', 1, NOW()),
(16, 'Diaspora Remittances and Direct Investment Channels', 'Remittance inflows remain crucial for household consumption stability. Developing targeted diaspora investment funds directs capital into productive domestic infrastructure and tech startups.', 'Channeling global capital into local commercial ventures.', 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e', (SELECT id FROM categories WHERE name = 'Diaspora & Global Ethiopia'), 'published', 1, NOW()),
(17, 'Knowledge Transfer and Global Tech Collaboration', 'Skilled professionals in the diaspora are actively mentoring local software engineers and funding venture incubators, accelerating the local digital ecosystem.', 'Bridging global tech expertise with emerging domestic innovators.', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c', (SELECT id FROM categories WHERE name = 'Diaspora & Global Ethiopia'), 'published', 1, NOW()),
(18, 'Export Expansion: Promoting Domestic Products Overseas', 'Global diaspora networks establish critical supply distribution pipelines for specialty exports like coffee, spices, and textiles across European and North American markets.', 'Expanding foreign retail footprints for high-value domestic goods.', 'https://images.unsplash.com/photo-1578575437130-527eed3abbec', (SELECT id FROM categories WHERE name = 'Diaspora & Global Ethiopia'), 'published', 1, NOW()),
(19, 'Behind the Scenes: Producing Data-Driven Economic Media', 'At Economixgna Studio, we combine empirical research with visual storytelling to make complex market data readable, actionable, and engaging for our audience.', 'Inside our production workflow for economic media storytelling.', 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4', (SELECT id FROM categories WHERE name = 'Economixgna Studio'), 'published', 1, NOW()),
(20, 'Podcast Series Launch: Insights with Industry Leaders', 'Our upcoming multimedia series features in-depth conversations with policymakers, entrepreneurs, and financial experts exploring emerging market trends.', 'Announcing our original multimedia interview series with key leaders.', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc', (SELECT id FROM categories WHERE name = 'Economixgna Studio'), 'published', 1, NOW()),
(21, 'Visualizing Trade Data: Interactive Graphics and Research', 'An introduction to our studio design methodology for turning multi-year macroeconomic datasets into clear interactive infographics and reports.', 'How we transform raw quantitative datasets into intuitive visual reports.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71', (SELECT id FROM categories WHERE name = 'Economixgna Studio'), 'published', 1, NOW());`
];

async function initDatabase() {
  try {
    console.log("Starting database initialization...");
    for (let schema of schemas) {
      await db.query(schema);
    }
    console.log("All core tables and sample posts created/populated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating database tables:", error);
    process.exit(1);
  }
}

initDatabase();