<?php
/**
 * Raise Ready Admin Panel
 * Single-file admin for raisereadybook.com
 * Uses TinyMCE CDN for WYSIWYG editing, no database needed.
 */
session_start();
error_reporting(E_ALL);

define('CONTENT_DIR', __DIR__ . '/content/');
define('CONFIG_FILE', __DIR__ . '/config.json');
define('BLOG_FILE', __DIR__ . '/blog_data.js');
define('PASS_FILE', CONTENT_DIR . 'admin_pass.php');

// Ensure content dir exists
if (!is_dir(CONTENT_DIR)) mkdir(CONTENT_DIR, 0755, true);

// Default password: "raiseready2025" - CHANGE THIS on first login
if (!file_exists(PASS_FILE)) {
    file_put_contents(PASS_FILE, '<?php $hash="' . password_hash('raiseready2025', PASSWORD_DEFAULT) . '";');
}
require PASS_FILE;

// ==================== AUTH ====================
function is_logged_in() { return !empty($_SESSION['admin_auth']); }

// CSRF token
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
$csrf_token = $_SESSION['csrf_token'];

function check_csrf() {
    return isset($_POST['csrf_token']) && hash_equals($_SESSION['csrf_token'], $_POST['csrf_token']);
}

$msg = '';

if (isset($_POST['action']) && $_POST['action'] === 'login') {
    if (password_verify($_POST['password'] ?? '', $hash)) {
        $_SESSION['admin_auth'] = true;
        header('Location: admin.php');
        exit;
    }
    $login_error = 'Wrong password.';
}

if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit;
}

// ==================== CHANGE PASSWORD ====================
if (is_logged_in() && isset($_POST['action']) && $_POST['action'] === 'change_password' && check_csrf()) {
    if (!empty($_POST['new_password']) && strlen($_POST['new_password']) >= 8) {
        $new_hash = password_hash($_POST['new_password'], PASSWORD_DEFAULT);
        file_put_contents(PASS_FILE, '<?php $hash="' . $new_hash . '";');
        $msg = 'Password changed.';
    } else {
        $msg = 'Password must be at least 8 characters.';
    }
}

// ==================== SAVE CONFIG ====================
if (is_logged_in() && isset($_POST['action']) && $_POST['action'] === 'save_config' && check_csrf()) {
    $config = json_decode(file_get_contents(CONFIG_FILE), true) ?: [];

    // Update Stripe links
    foreach (['book','exercises','bundle','tpl_preseed','tpl_seed','tpl_seriesa','tpl_seriesb'] as $k) {
        if (isset($_POST['stripe_'.$k])) $config['stripe_links'][$k] = trim($_POST['stripe_'.$k]);
    }
    // Update Calendly
    if (isset($_POST['calendly_url'])) $config['calendly_url'] = trim($_POST['calendly_url']);

    // Update prices
    $price_keys = ['book','exercises','bundle','tpl_preseed','tpl_seed','tpl_seriesa','tpl_seriesb','hire_rate'];
    foreach ($price_keys as $k) {
        if (isset($_POST['price_'.$k])) {
            $config['prices'][$k]['current'] = floatval($_POST['price_'.$k]);
        }
        if (isset($_POST['orig_'.$k])) {
            $val = trim($_POST['orig_'.$k]);
            $config['prices'][$k]['original'] = $val !== '' ? floatval($val) : null;
        }
    }

    // Update site settings
    if (isset($_POST['site_email'])) $config['site']['email'] = trim($_POST['site_email']);

    file_put_contents(CONFIG_FILE, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    $msg = 'Settings saved.';
}

// ==================== SAVE BLOG POST ====================
if (is_logged_in() && isset($_POST['action']) && $_POST['action'] === 'save_blog' && check_csrf()) {
    $blog_js = file_get_contents(BLOG_FILE);

    // Parse the JS array (extract JSON portion)
    $json_str = preg_replace('/^const BLOG_ARTICLES=/', '', $blog_js);
    $json_str = rtrim($json_str, ";\n");

    // We need to handle JS template literals - convert to JSON strings
    // This is tricky, so we use a different approach: store blog posts as JSON separately
    // and regenerate the JS file

    $blog_json_file = CONTENT_DIR . 'blog_posts.json';

    // If blog_posts.json doesn't exist, parse from blog_data.js using regex
    if (!file_exists($blog_json_file)) {
        preg_match_all('/\{num:"([^"]*)",title:"([^"]*)",slug:"([^"]*)",tldr:"([^"]*)",category:"([^"]*)",pillar:"([^"]*)",readTime:(\d+),body:`((?:[^`\\\\]|\\\\.)*)`\}/', $blog_js, $matches, PREG_SET_ORDER);
        $posts = [];
        foreach ($matches as $m) {
            $posts[] = [
                'num' => $m[1],
                'title' => $m[2],
                'slug' => $m[3],
                'tldr' => $m[4],
                'category' => $m[5],
                'pillar' => $m[6],
                'readTime' => intval($m[7]),
                'body' => $m[8]
            ];
        }
        file_put_contents($blog_json_file, json_encode($posts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    $posts = json_decode(file_get_contents($blog_json_file), true);
    $idx = intval($_POST['blog_index']);

    if ($idx >= 0 && $idx < count($posts)) {
        $posts[$idx]['title'] = $_POST['blog_title'] ?? $posts[$idx]['title'];
        $posts[$idx]['tldr'] = $_POST['blog_tldr'] ?? $posts[$idx]['tldr'];
        $posts[$idx]['body'] = $_POST['blog_body'] ?? $posts[$idx]['body'];
        $posts[$idx]['category'] = $_POST['blog_category'] ?? $posts[$idx]['category'];
        $word_count = str_word_count(strip_tags($posts[$idx]['body']));
        $posts[$idx]['readTime'] = max(3, round($word_count / 230));

        file_put_contents($blog_json_file, json_encode($posts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        // Regenerate blog_data.js
        regenerate_blog_js($posts);
        $msg = 'Blog post saved.';
    }
}

// ==================== DELETE BLOG POST ====================
if (is_logged_in() && isset($_POST['action']) && $_POST['action'] === 'delete_blog' && check_csrf()) {
    $blog_json_file = CONTENT_DIR . 'blog_posts.json';
    if (file_exists($blog_json_file)) {
        $posts = json_decode(file_get_contents($blog_json_file), true);
        $idx = intval($_POST['blog_index']);
        if ($idx >= 0 && $idx < count($posts)) {
            array_splice($posts, $idx, 1);
            file_put_contents($blog_json_file, json_encode($posts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            regenerate_blog_js($posts);
            $msg = 'Blog post deleted.';
        }
    }
}

// ==================== ADD BLOG POST ====================
if (is_logged_in() && isset($_POST['action']) && $_POST['action'] === 'add_blog' && check_csrf()) {
    $blog_json_file = CONTENT_DIR . 'blog_posts.json';
    $posts = file_exists($blog_json_file) ? json_decode(file_get_contents($blog_json_file), true) : [];

    $title = trim($_POST['blog_title'] ?? 'New Post');
    $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $title));
    $slug = trim($slug, '-');

    $new_post = [
        'num' => str_pad(count($posts) + 1, 3, '0', STR_PAD_LEFT),
        'title' => $title,
        'slug' => substr($slug, 0, 80),
        'tldr' => trim($_POST['blog_tldr'] ?? ''),
        'category' => $_POST['blog_category'] ?? 'Fundraising',
        'pillar' => 'A',
        'readTime' => 3,
        'body' => $_POST['blog_body'] ?? '<p>New blog post content.</p>'
    ];

    $cat_map = [
        'Fundraising' => 'A', 'Financial Modeling' => 'B', 'Unit Economics' => 'C',
        'Exits & M&A' => 'D', 'Finance Operations' => 'E', 'AI in Finance' => 'F',
        'Founder Stories' => 'G'
    ];
    $new_post['pillar'] = $cat_map[$new_post['category']] ?? 'A';
    $word_count = str_word_count(strip_tags($new_post['body']));
    $new_post['readTime'] = max(3, round($word_count / 230));

    $posts[] = $new_post;
    file_put_contents($blog_json_file, json_encode($posts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    regenerate_blog_js($posts);
    $msg = 'New blog post added.';
}

function regenerate_blog_js($posts) {
    $entries = [];
    foreach ($posts as $p) {
        $title = str_replace('"', '\\"', $p['title']);
        $tldr = str_replace('"', '\\"', $p['tldr']);
        $body = str_replace('`', '\\`', $p['body']);
        $body = str_replace('${', '\\${', $body);
        $entries[] = '{num:"' . $p['num'] . '",title:"' . $title . '",slug:"' . $p['slug'] . '",tldr:"' . $tldr . '",category:"' . $p['category'] . '",pillar:"' . $p['pillar'] . '",readTime:' . $p['readTime'] . ',body:`' . $body . '`}';
    }
    $js = "const BLOG_ARTICLES=[\n" . implode(",\n", $entries) . "\n];";
    file_put_contents(BLOG_FILE, $js);
}

// ==================== FILE UPLOAD ====================
define('ROOT_DIR', realpath(__DIR__) . '/');
$upload_msg = '';

// Sanitize path: strip traversal sequences recursively
function sanitize_path($p) {
    $p = trim($p);
    while (strpos($p, '..') !== false) $p = str_replace('..', '', $p);
    $p = ltrim($p, '/');
    $p = preg_replace('#/+#', '/', $p); // collapse multiple slashes
    return $p;
}

// Validate resolved path is within ROOT_DIR
function is_safe_path($full_path) {
    $real = realpath(dirname($full_path));
    if ($real === false) return false;
    return strpos($real . '/', ROOT_DIR) === 0;
}

if (is_logged_in() && isset($_POST['action']) && $_POST['action'] === 'upload_file' && check_csrf()) {
    $dest = sanitize_path($_POST['upload_dest'] ?? '');
    $full_dest = ROOT_DIR . $dest;

    if (!is_dir($full_dest)) {
        @mkdir($full_dest, 0755, true);
    }

    if (!empty($_FILES['upload_files']['name'][0])) {
        $count = 0;
        foreach ($_FILES['upload_files']['name'] as $i => $name) {
            if ($_FILES['upload_files']['error'][$i] === UPLOAD_ERR_OK) {
                $safe_name = basename($name);
                $target = rtrim($full_dest, '/') . '/' . $safe_name;
                if (move_uploaded_file($_FILES['upload_files']['tmp_name'][$i], $target)) {
                    $count++;
                }
            }
        }
        $upload_msg = $count . ' file(s) uploaded to /' . $dest;
    } else {
        $upload_msg = 'No files selected.';
    }
    header('Location: admin.php?page=files&dir=' . urlencode($dest) . '&msg=' . urlencode($upload_msg));
    exit;
}

// ==================== CREATE FOLDER ====================
if (is_logged_in() && isset($_POST['action']) && $_POST['action'] === 'create_folder' && check_csrf()) {
    $folder_path = sanitize_path($_POST['folder_path'] ?? '');
    $full_path = ROOT_DIR . $folder_path;
    if (!is_dir($full_path)) {
        @mkdir($full_path, 0755, true);
        $upload_msg = 'Folder created: /' . $folder_path;
    } else {
        $upload_msg = 'Folder already exists.';
    }
    $parent = dirname($folder_path);
    header('Location: admin.php?page=files&dir=' . urlencode($parent === '.' ? '' : $parent) . '&msg=' . urlencode($upload_msg));
    exit;
}

// ==================== DELETE FILE ====================
if (is_logged_in() && isset($_POST['action']) && $_POST['action'] === 'delete_file' && check_csrf()) {
    $file_path = sanitize_path($_POST['file_path'] ?? '');
    $full_path = ROOT_DIR . $file_path;
    $real = realpath($full_path);
    if ($real && file_exists($real) && !is_dir($real) && strpos($real, ROOT_DIR) === 0) {
        unlink($real);
        $upload_msg = 'Deleted: ' . basename($file_path);
    }
    $parent = dirname($file_path);
    header('Location: admin.php?page=files&dir=' . urlencode($parent === '.' ? '' : $parent) . '&msg=' . urlencode($upload_msg));
    exit;
}

// Helper: list directory contents
function list_dir($path) {
    $items = [];
    if (!is_dir($path)) return $items;
    $files = scandir($path);
    foreach ($files as $f) {
        if ($f === '.' || $f === '..') continue;
        if ($f === 'content' && $path === ROOT_DIR) continue; // hide admin content dir
        if ($f === 'admin_pass.php') continue;
        $full = $path . '/' . $f;
        $items[] = [
            'name' => $f,
            'is_dir' => is_dir($full),
            'size' => is_file($full) ? filesize($full) : 0,
            'modified' => filemtime($full),
        ];
    }
    usort($items, function($a, $b) {
        if ($a['is_dir'] !== $b['is_dir']) return $b['is_dir'] - $a['is_dir'];
        return strcasecmp($a['name'], $b['name']);
    });
    return $items;
}

function format_size($bytes) {
    if ($bytes >= 1048576) return number_format($bytes / 1048576, 1) . ' MB';
    if ($bytes >= 1024) return number_format($bytes / 1024, 1) . ' KB';
    return $bytes . ' B';
}

// ==================== LOAD DATA ====================
$config = file_exists(CONFIG_FILE) ? json_decode(file_get_contents(CONFIG_FILE), true) : [];
$blog_json_file = CONTENT_DIR . 'blog_posts.json';

// Ensure blog_posts.json exists
if (is_logged_in() && !file_exists($blog_json_file) && file_exists(BLOG_FILE)) {
    $blog_js = file_get_contents(BLOG_FILE);
    preg_match_all('/\{num:"([^"]*)",title:"([^"]*)",slug:"([^"]*)",tldr:"([^"]*)",category:"([^"]*)",pillar:"([^"]*)",readTime:(\d+),body:`((?:[^`\\\\]|\\\\.)*)`\}/', $blog_js, $matches, PREG_SET_ORDER);
    $posts = [];
    foreach ($matches as $m) {
        $posts[] = [
            'num' => $m[1], 'title' => $m[2], 'slug' => $m[3], 'tldr' => $m[4],
            'category' => $m[5], 'pillar' => $m[6], 'readTime' => intval($m[7]), 'body' => $m[8]
        ];
    }
    file_put_contents($blog_json_file, json_encode($posts, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$blog_posts = file_exists($blog_json_file) ? json_decode(file_get_contents($blog_json_file), true) : [];

$page = $_GET['page'] ?? 'dashboard';
$edit_idx = isset($_GET['edit']) ? intval($_GET['edit']) : -1;
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Admin - Raise Ready</title>
<script src="https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js" referrerpolicy="origin"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0d0d14;--card:#13131f;--border:#1e1e2e;--gold:#c8a45a;--gold2:#e5c97e;--text:#e8e4dc;--dim:#6e6a61;--red:#c0392b;--green:#27ae60}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
a{color:var(--gold);text-decoration:none}
a:hover{color:var(--gold2)}

/* Login */
.login-wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem}
.login-box{background:var(--card);border:1px solid var(--border);padding:3rem;width:100%;max-width:400px}
.login-box h1{font-size:1.4rem;margin-bottom:.5rem;color:var(--gold)}
.login-box p{font-size:.85rem;color:var(--dim);margin-bottom:2rem}

/* Layout */
.layout{display:grid;grid-template-columns:220px 1fr;min-height:100vh}
.sidebar{background:var(--card);border-right:1px solid var(--border);padding:1.5rem 0;position:sticky;top:0;height:100vh}
.sidebar-logo{padding:0 1.5rem 1.5rem;font-size:1.1rem;color:var(--gold);font-weight:700;border-bottom:1px solid var(--border)}
.sidebar-nav{padding:1rem 0}
.sidebar-nav a{display:block;padding:.7rem 1.5rem;font-size:.82rem;color:var(--dim);transition:all .15s}
.sidebar-nav a:hover,.sidebar-nav a.active{color:var(--text);background:rgba(200,164,90,.05);border-right:2px solid var(--gold)}
.sidebar-nav a .icon{margin-right:.5rem;opacity:.6}
.main{padding:2rem 3rem;overflow-y:auto}
.main h1{font-size:1.6rem;margin-bottom:.3rem}
.main .subtitle{font-size:.82rem;color:var(--dim);margin-bottom:2rem}

/* Components */
.card{background:var(--card);border:1px solid var(--border);padding:1.8rem;margin-bottom:1.5rem}
.card h2{font-size:1.05rem;color:var(--gold);margin-bottom:1rem}
.form-row{margin-bottom:1.2rem}
.form-row label{display:block;font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--dim);margin-bottom:.4rem}
.form-row input,.form-row select,.form-row textarea{width:100%;padding:.6rem .8rem;background:var(--bg);border:1px solid var(--border);color:var(--text);font-size:.85rem;border-radius:3px}
.form-row input:focus,.form-row textarea:focus{border-color:var(--gold);outline:none}
.form-row textarea{min-height:80px;resize:vertical}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.btn{display:inline-block;padding:.6rem 1.4rem;font-size:.78rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;border:none;cursor:pointer;transition:all .15s;border-radius:3px}
.btn-gold{background:var(--gold);color:#0d0d14}.btn-gold:hover{background:var(--gold2)}
.btn-ghost{background:transparent;color:var(--text);border:1px solid var(--border)}.btn-ghost:hover{border-color:var(--gold);color:var(--gold)}
.btn-red{background:var(--red);color:#fff}.btn-red:hover{opacity:.85}
.btn-green{background:var(--green);color:#fff}.btn-green:hover{opacity:.85}
.msg{padding:.8rem 1rem;margin-bottom:1.5rem;font-size:.82rem;border-left:3px solid var(--gold);background:rgba(200,164,90,.06)}
.msg-error{border-left-color:var(--red);background:rgba(192,57,43,.06)}

/* Blog list */
.blog-table{width:100%;border-collapse:collapse}
.blog-table th{text-align:left;font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;color:var(--dim);padding:.8rem;border-bottom:1px solid var(--border);font-weight:400}
.blog-table td{padding:.8rem;font-size:.82rem;border-bottom:1px solid rgba(30,30,46,.5)}
.blog-table tr:hover td{background:rgba(200,164,90,.02)}
.blog-table .num{color:var(--gold);font-family:monospace;font-size:.75rem}
.blog-table .cat{font-size:.65rem;text-transform:uppercase;letter-spacing:.06em;padding:.2rem .5rem;border:1px solid rgba(200,164,90,.2);color:var(--gold);white-space:nowrap}
.blog-table .actions{white-space:nowrap}
.blog-table .actions a{margin-right:.8rem;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em}

/* Stats */
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:2rem}
.stat-card{background:var(--card);border:1px solid var(--border);padding:1.4rem;text-align:center}
.stat-card .n{font-size:2rem;color:var(--gold);font-weight:700}
.stat-card .l{font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;color:var(--dim);margin-top:.3rem}

/* File Manager */
.fm-actions{display:flex;gap:1.5rem;margin-bottom:1.5rem}
.fm-breadcrumbs{font-size:.82rem;padding:.8rem 1rem;background:var(--card);border:1px solid var(--border);margin-bottom:1rem;font-family:monospace}
.fm-breadcrumbs a{color:var(--gold)}.fm-breadcrumbs a:hover{color:var(--gold2)}
.fm-sep{color:var(--dim);margin:0 .3rem}
.fm-current{color:var(--text)}
.fm-table{width:100%;border-collapse:collapse}
.fm-table th{text-align:left;font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;color:var(--dim);padding:.8rem;border-bottom:1px solid var(--border);font-weight:400}
.fm-table td{padding:.6rem .8rem;font-size:.82rem;border-bottom:1px solid rgba(30,30,46,.5)}
.fm-table tr:hover td{background:rgba(200,164,90,.02)}
.fm-folder-link{color:var(--gold);font-weight:600;text-decoration:none}.fm-folder-link:hover{color:var(--gold2)}
.fm-file-icon{opacity:.5}
.fm-size,.fm-date{font-family:monospace;font-size:.75rem;color:var(--dim);white-space:nowrap}
.fm-actions-cell{white-space:nowrap}
.fm-action-link{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;margin-right:.8rem}
.fm-delete-btn{background:none;border:none;color:var(--red);cursor:pointer;font-size:.72rem;text-transform:uppercase;letter-spacing:.05em}
.fm-delete-btn:hover{opacity:.7}
.fm-file-input{padding:.4rem 0}

@media(max-width:768px){
  .layout{grid-template-columns:1fr}
  .sidebar{position:fixed;bottom:0;left:0;right:0;height:auto;border-right:none;border-top:1px solid var(--border);z-index:100;padding:0}
  .sidebar-logo{display:none}
  .sidebar-nav{display:flex;padding:0;overflow-x:auto}
  .sidebar-nav a{padding:.8rem 1rem;white-space:nowrap;border-right:none;border-bottom:2px solid transparent;font-size:.7rem}
  .sidebar-nav a.active{border-bottom-color:var(--gold);border-right:none}
  .main{padding:1.5rem;padding-bottom:5rem}
  .stats-grid{grid-template-columns:1fr 1fr}
  .form-grid{grid-template-columns:1fr}
  .fm-actions{flex-direction:column}
}
</style>
</head>
<body>

<?php if (!is_logged_in()): ?>
<!-- ==================== LOGIN ==================== -->
<div class="login-wrap">
  <div class="login-box">
    <h1>Raise Ready Admin</h1>
    <p>Enter your admin password to continue.</p>
    <?php if (!empty($login_error)): ?><div class="msg msg-error"><?= $login_error ?></div><?php endif; ?>
    <form method="POST">
      <input type="hidden" name="action" value="login">
      <div class="form-row">
        <label>Password</label>
        <input type="password" name="password" autofocus required>
      </div>
      <button type="submit" class="btn btn-gold" style="width:100%">Sign In</button>
    </form>
    <p style="margin-top:1.5rem;font-size:.72rem;color:var(--dim)">Default password: raiseready2025</p>
  </div>
</div>

<?php else: ?>
<!-- ==================== ADMIN PANEL ==================== -->
<div class="layout">
  <div class="sidebar">
    <div class="sidebar-logo">Raise Ready</div>
    <div class="sidebar-nav">
      <a href="admin.php?page=dashboard" class="<?= $page==='dashboard'?'active':'' ?>"><span class="icon">&#9632;</span> Dashboard</a>
      <a href="admin.php?page=settings" class="<?= $page==='settings'?'active':'' ?>"><span class="icon">&#9881;</span> Settings</a>
      <a href="admin.php?page=blog" class="<?= $page==='blog'||$page==='edit_blog'||$page==='add_blog'?'active':'' ?>"><span class="icon">&#9998;</span> Blog Posts</a>
      <a href="admin.php?page=files" class="<?= $page==='files'?'active':'' ?>"><span class="icon">&#128193;</span> Files</a>
      <a href="admin.php?page=password" class="<?= $page==='password'?'active':'' ?>"><span class="icon">&#9919;</span> Password</a>
      <a href="index.html" target="_blank"><span class="icon">&#8599;</span> View Site</a>
      <a href="admin.php?logout=1"><span class="icon">&#10005;</span> Log Out</a>
    </div>
  </div>

  <div class="main">
    <?php if (!empty($msg)): ?><div class="msg"><?= htmlspecialchars($msg) ?></div><?php endif; ?>

    <?php if ($page === 'dashboard'): ?>
    <!-- ==================== DASHBOARD ==================== -->
    <h1>Dashboard</h1>
    <p class="subtitle">raisereadybook.com admin panel</p>

    <div class="stats-grid">
      <div class="stat-card"><div class="n"><?= count($blog_posts) ?></div><div class="l">Blog Posts</div></div>
      <div class="stat-card"><div class="n">$<?= number_format($config['prices']['book']['current'] ?? 14.99, 2) ?></div><div class="l">Book Price</div></div>
      <div class="stat-card"><div class="n">$<?= number_format($config['prices']['hire_rate']['current'] ?? 499, 0) ?></div><div class="l">Hourly Rate</div></div>
      <div class="stat-card"><div class="n">7</div><div class="l">Products</div></div>
    </div>

    <div class="card">
      <h2>Quick Links</h2>
      <p style="font-size:.85rem;line-height:1.8;color:var(--dim)">
        <a href="admin.php?page=settings">Edit prices, Stripe links, and Calendly URL</a><br>
        <a href="admin.php?page=blog">Manage blog posts (add, edit, delete)</a><br>
        <a href="admin.php?page=add_blog">Write a new blog post</a><br>
        <a href="admin.php?page=files">Upload and manage files</a><br>
        <a href="admin.php?page=password">Change admin password</a><br>
        <a href="index.html" target="_blank">View live site</a>
      </p>
    </div>

    <div class="card">
      <h2>How to Edit</h2>
      <p style="font-size:.82rem;line-height:1.8;color:var(--dim)">
        <strong style="color:var(--text)">Prices & Links:</strong> Go to Settings to update Stripe payment links, prices, and your Calendly booking URL. Changes take effect immediately.<br><br>
        <strong style="color:var(--text)">Blog Posts:</strong> Go to Blog Posts to edit any article. The editor works like Microsoft Word. Changes are saved to blog_data.js automatically.<br><br>
        <strong style="color:var(--text)">Page Layout:</strong> To edit the main page layout (headings, sections), edit index.html directly via Namecheap File Manager (cPanel > File Manager > public_html > index.html).
      </p>
    </div>

    <?php elseif ($page === 'settings'): ?>
    <!-- ==================== SETTINGS ==================== -->
    <h1>Settings</h1>
    <p class="subtitle">Stripe links, prices, and contact URLs</p>

    <form method="POST">
      <input type="hidden" name="action" value="save_config">
      <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">

      <div class="card">
        <h2>Stripe Payment Links</h2>
        <p style="font-size:.78rem;color:var(--dim);margin-bottom:1rem">Paste your Stripe Payment Link URLs here. Create them at <a href="https://dashboard.stripe.com/payment-links" target="_blank">dashboard.stripe.com/payment-links</a></p>
        <?php
        $stripe_labels = [
            'book' => 'Raise Ready Book',
            'exercises' => 'Companion Exercises',
            'bundle' => 'Book + Exercises Bundle',
            'tpl_preseed' => 'Template: Pre-Seed',
            'tpl_seed' => 'Template: Seed',
            'tpl_seriesa' => 'Template: Series A',
            'tpl_seriesb' => 'Template: Series B'
        ];
        foreach ($stripe_labels as $k => $label): ?>
        <div class="form-row">
          <label><?= $label ?></label>
          <input type="url" name="stripe_<?= $k ?>" value="<?= htmlspecialchars($config['stripe_links'][$k] ?? '') ?>" placeholder="https://buy.stripe.com/...">
        </div>
        <?php endforeach; ?>
      </div>

      <div class="card">
        <h2>Calendly Booking URL</h2>
        <div class="form-row">
          <label>Hire Yanni - Booking Link</label>
          <input type="url" name="calendly_url" value="<?= htmlspecialchars($config['calendly_url'] ?? '') ?>" placeholder="https://calendly.com/...">
        </div>
      </div>

      <div class="card">
        <h2>Prices</h2>
        <p style="font-size:.78rem;color:var(--dim);margin-bottom:1rem">Update displayed prices. The actual charge amount is controlled by Stripe.</p>
        <?php
        $price_labels = [
            'book' => 'Raise Ready Book',
            'exercises' => 'Companion Exercises',
            'bundle' => 'Book + Exercises Bundle',
            'tpl_preseed' => 'Template: Pre-Seed ($)',
            'tpl_seed' => 'Template: Seed ($)',
            'tpl_seriesa' => 'Template: Series A ($)',
            'tpl_seriesb' => 'Template: Series B ($)',
            'hire_rate' => 'Hourly Rate ($)'
        ];
        foreach ($price_labels as $k => $label): ?>
        <div class="form-grid">
          <div class="form-row">
            <label><?= $label ?> - Current Price</label>
            <input type="number" step="0.01" name="price_<?= $k ?>" value="<?= $config['prices'][$k]['current'] ?? '' ?>">
          </div>
          <div class="form-row">
            <label><?= $label ?> - Original Price (leave blank if no discount)</label>
            <input type="number" step="0.01" name="orig_<?= $k ?>" value="<?= $config['prices'][$k]['original'] ?? '' ?>">
          </div>
        </div>
        <?php endforeach; ?>
      </div>

      <div class="card">
        <h2>Site Settings</h2>
        <div class="form-row">
          <label>Contact Email</label>
          <input type="email" name="site_email" value="<?= htmlspecialchars($config['site']['email'] ?? 'hello@augmented.co') ?>">
        </div>
      </div>

      <button type="submit" class="btn btn-gold">Save All Settings</button>
    </form>

    <?php elseif ($page === 'blog'): ?>
    <!-- ==================== BLOG LIST ==================== -->
    <h1>Blog Posts</h1>
    <p class="subtitle"><?= count($blog_posts) ?> articles</p>

    <div style="margin-bottom:1.5rem">
      <a href="admin.php?page=add_blog" class="btn btn-gold">+ New Post</a>
    </div>

    <div class="card" style="padding:0;overflow-x:auto">
      <table class="blog-table">
        <thead><tr><th>#</th><th>Title</th><th>Category</th><th>Read Time</th><th>Actions</th></tr></thead>
        <tbody>
        <?php foreach ($blog_posts as $i => $post): ?>
        <tr>
          <td class="num"><?= htmlspecialchars($post['num']) ?></td>
          <td><?= htmlspecialchars(mb_substr($post['title'], 0, 70)) ?><?= mb_strlen($post['title']) > 70 ? '...' : '' ?></td>
          <td><span class="cat"><?= htmlspecialchars($post['category']) ?></span></td>
          <td><?= $post['readTime'] ?> min</td>
          <td class="actions">
            <a href="admin.php?page=edit_blog&edit=<?= $i ?>">Edit</a>
            <form method="POST" style="display:inline" onsubmit="return confirm('Delete this post?')">
              <input type="hidden" name="action" value="delete_blog">
      <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">
              <input type="hidden" name="blog_index" value="<?= $i ?>">
              <button type="submit" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em">Delete</button>
            </form>
          </td>
        </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>

    <?php elseif ($page === 'edit_blog' && $edit_idx >= 0 && $edit_idx < count($blog_posts)): ?>
    <!-- ==================== EDIT BLOG POST ==================== -->
    <?php $post = $blog_posts[$edit_idx]; ?>
    <h1>Edit: <?= htmlspecialchars(mb_substr($post['title'], 0, 60)) ?></h1>
    <p class="subtitle"><a href="admin.php?page=blog">&larr; Back to all posts</a></p>

    <form method="POST">
      <input type="hidden" name="action" value="save_blog">
      <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">
      <input type="hidden" name="blog_index" value="<?= $edit_idx ?>">

      <div class="card">
        <h2>Post Details</h2>
        <div class="form-row">
          <label>Title</label>
          <input type="text" name="blog_title" value="<?= htmlspecialchars($post['title']) ?>">
        </div>
        <div class="form-grid">
          <div class="form-row">
            <label>Category</label>
            <select name="blog_category">
              <?php foreach (['Fundraising','Financial Modeling','Unit Economics','Exits & M&A','Finance Operations','AI in Finance','Founder Stories'] as $cat): ?>
              <option value="<?= $cat ?>" <?= $post['category'] === $cat ? 'selected' : '' ?>><?= $cat ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="form-row">
            <label>Article Number</label>
            <input type="text" value="<?= htmlspecialchars($post['num']) ?>" disabled style="opacity:.5">
          </div>
        </div>
        <div class="form-row">
          <label>TL;DR (shown in article list)</label>
          <textarea name="blog_tldr" rows="3"><?= htmlspecialchars($post['tldr']) ?></textarea>
        </div>
      </div>

      <div class="card">
        <h2>Article Content</h2>
        <div class="form-row">
          <textarea name="blog_body" id="blog-editor"><?= htmlspecialchars($post['body']) ?></textarea>
        </div>
      </div>

      <button type="submit" class="btn btn-gold">Save Post</button>
      <a href="admin.php?page=blog" class="btn btn-ghost" style="margin-left:.5rem">Cancel</a>
    </form>

    <script>
    tinymce.init({
      selector: '#blog-editor',
      height: 600,
      skin: 'oxide-dark',
      content_css: 'dark',
      plugins: 'lists link code table paste wordcount',
      toolbar: 'undo redo | formatselect | bold italic underline | bullist numlist | link table | code | wordcount',
      menubar: false,
      statusbar: true,
      paste_as_text: true,
      content_style: 'body{font-family:-apple-system,sans-serif;font-size:14px;color:#e8e4dc;background:#0d0d14;line-height:1.8} h3{color:#c8a45a;font-size:1.2em;margin:1.5em 0 0.5em} p{margin-bottom:0.8em} a{color:#c8a45a}'
    });
    </script>

    <?php elseif ($page === 'add_blog'): ?>
    <!-- ==================== ADD BLOG POST ==================== -->
    <h1>New Blog Post</h1>
    <p class="subtitle"><a href="admin.php?page=blog">&larr; Back to all posts</a></p>

    <form method="POST">
      <input type="hidden" name="action" value="add_blog">
      <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">

      <div class="card">
        <h2>Post Details</h2>
        <div class="form-row">
          <label>Title</label>
          <input type="text" name="blog_title" placeholder="Your article title" required>
        </div>
        <div class="form-row">
          <label>Category</label>
          <select name="blog_category">
            <?php foreach (['Fundraising','Financial Modeling','Unit Economics','Exits & M&A','Finance Operations','AI in Finance','Founder Stories'] as $cat): ?>
            <option value="<?= $cat ?>"><?= $cat ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="form-row">
          <label>TL;DR (shown in article list)</label>
          <textarea name="blog_tldr" rows="3" placeholder="Brief summary of the article"></textarea>
        </div>
      </div>

      <div class="card">
        <h2>Article Content</h2>
        <div class="form-row">
          <textarea name="blog_body" id="blog-editor"><p>Start writing your article here.</p></textarea>
        </div>
      </div>

      <button type="submit" class="btn btn-gold">Publish Post</button>
      <a href="admin.php?page=blog" class="btn btn-ghost" style="margin-left:.5rem">Cancel</a>
    </form>

    <script>
    tinymce.init({
      selector: '#blog-editor',
      height: 600,
      skin: 'oxide-dark',
      content_css: 'dark',
      plugins: 'lists link code table paste wordcount',
      toolbar: 'undo redo | formatselect | bold italic underline | bullist numlist | link table | code | wordcount',
      menubar: false,
      statusbar: true,
      paste_as_text: true,
      content_style: 'body{font-family:-apple-system,sans-serif;font-size:14px;color:#e8e4dc;background:#0d0d14;line-height:1.8} h3{color:#c8a45a;font-size:1.2em;margin:1.5em 0 0.5em} p{margin-bottom:0.8em} a{color:#c8a45a}'
    });
    </script>

    <?php elseif ($page === 'files'): ?>
    <!-- ==================== FILE MANAGER ==================== -->
    <?php
    $browse = sanitize_path($_GET['dir'] ?? '');
    $browse_full = ROOT_DIR . ($browse ? $browse . '/' : '');
    if (!is_dir($browse_full)) { $browse = ''; $browse_full = ROOT_DIR; }
    $dir_items = list_dir($browse_full);

    // Build breadcrumbs
    $crumbs = [['name' => 'Root', 'path' => '']];
    if ($browse) {
        $parts = explode('/', $browse);
        $acc = '';
        foreach ($parts as $p) {
            $acc .= ($acc ? '/' : '') . $p;
            $crumbs[] = ['name' => $p, 'path' => $acc];
        }
    }
    ?>
    <h1>File Manager</h1>
    <p class="subtitle">Upload, browse, and manage files on your hosting</p>

    <?php $fm_msg = $_GET['msg'] ?? '';
    if ($fm_msg): ?><div class="msg"><?= htmlspecialchars($fm_msg) ?></div><?php endif; ?>

    <div class="fm-actions">
      <!-- Upload Files -->
      <div class="card" style="flex:1">
        <h2>Upload Files</h2>
        <form method="POST" enctype="multipart/form-data">
          <input type="hidden" name="action" value="upload_file">
      <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">
          <div class="form-row">
            <label>Destination Folder</label>
            <input type="text" name="upload_dest" value="<?= htmlspecialchars($browse) ?>" placeholder="e.g. tools/ or blog/images/">
          </div>
          <div class="form-row">
            <label>Select Files</label>
            <input type="file" name="upload_files[]" multiple class="fm-file-input">
          </div>
          <button type="submit" class="btn btn-gold">Upload</button>
        </form>
      </div>
      <!-- Create Folder -->
      <div class="card" style="flex:0 0 280px">
        <h2>New Folder</h2>
        <form method="POST">
          <input type="hidden" name="action" value="create_folder">
      <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">
          <div class="form-row">
            <label>Folder Path</label>
            <input type="text" name="folder_path" placeholder="e.g. tools/pdfs">
          </div>
          <button type="submit" class="btn btn-ghost">Create Folder</button>
        </form>
      </div>
    </div>

    <!-- Breadcrumbs -->
    <div class="fm-breadcrumbs">
      <?php foreach ($crumbs as $i => $c): ?>
        <?php if ($i > 0): ?> <span class="fm-sep">/</span> <?php endif; ?>
        <?php if ($i < count($crumbs) - 1): ?>
          <a href="admin.php?page=files&dir=<?= urlencode($c['path']) ?>"><?= htmlspecialchars($c['name']) ?></a>
        <?php else: ?>
          <span class="fm-current"><?= htmlspecialchars($c['name']) ?></span>
        <?php endif; ?>
      <?php endforeach; ?>
    </div>

    <!-- File Listing -->
    <div class="card" style="padding:0;overflow-x:auto">
      <table class="fm-table">
        <thead><tr><th>Name</th><th>Size</th><th>Modified</th><th>Actions</th></tr></thead>
        <tbody>
        <?php if ($browse): ?>
          <tr>
            <td colspan="4" style="padding:.6rem .8rem">
              <?php $parent = implode('/', array_slice(explode('/', $browse), 0, -1)); ?>
              <a href="admin.php?page=files&dir=<?= urlencode($parent) ?>" class="fm-folder-link">&#8592; Parent Folder</a>
            </td>
          </tr>
        <?php endif; ?>
        <?php if (empty($dir_items)): ?>
          <tr><td colspan="4" style="padding:1.2rem .8rem;color:var(--dim);font-size:.82rem">Empty directory</td></tr>
        <?php endif; ?>
        <?php foreach ($dir_items as $item):
          $item_path = ($browse ? $browse . '/' : '') . $item['name'];
        ?>
          <tr>
            <td>
              <?php if ($item['is_dir']): ?>
                <a href="admin.php?page=files&dir=<?= urlencode($item_path) ?>" class="fm-folder-link">&#128193; <?= htmlspecialchars($item['name']) ?></a>
              <?php else: ?>
                <span class="fm-file-icon">&#128196;</span> <?= htmlspecialchars($item['name']) ?>
              <?php endif; ?>
            </td>
            <td class="fm-size"><?= $item['is_dir'] ? '-' : format_size($item['size']) ?></td>
            <td class="fm-date"><?= date('d M Y H:i', $item['modified']) ?></td>
            <td class="fm-actions-cell">
              <?php if (!$item['is_dir']): ?>
                <a href="/<?= htmlspecialchars($item_path) ?>" target="_blank" class="fm-action-link">View</a>
                <form method="POST" style="display:inline" onsubmit="return confirm('Delete <?= htmlspecialchars(addslashes($item['name'])) ?>?')">
                  <input type="hidden" name="action" value="delete_file">
      <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">
                  <input type="hidden" name="file_path" value="<?= htmlspecialchars($item_path) ?>">
                  <button type="submit" class="fm-delete-btn">Delete</button>
                </form>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>

    <?php elseif ($page === 'password'): ?>
    <!-- ==================== CHANGE PASSWORD ==================== -->
    <h1>Change Password</h1>
    <p class="subtitle">Update your admin password</p>

    <div class="card">
      <form method="POST">
        <input type="hidden" name="action" value="change_password">
      <input type="hidden" name="csrf_token" value="<?= $csrf_token ?>">
        <div class="form-row">
          <label>New Password (minimum 8 characters)</label>
          <input type="password" name="new_password" required minlength="8">
        </div>
        <button type="submit" class="btn btn-gold">Update Password</button>
      </form>
    </div>

    <?php endif; ?>
  </div>
</div>
<?php endif; ?>

</body>
</html>
