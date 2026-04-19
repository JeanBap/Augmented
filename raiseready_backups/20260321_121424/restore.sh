#!/bin/bash
# Restore raisereadybook.com to 20260321_121424 backup
HOST="ftp.raisereadybook.com"
USER="d3658425@raisereadybook.com"
PASS="Melenegianni123!"
FTP_BASE="ftp://$HOST/public_html"
DIR="/Users/yanni/Desktop/raiseready_backups/20260321_121424"

echo "Restoring raisereadybook.com from backup 20260321_121424 ..."
[ -f "$DIR/admin.php" ] && curl -s -T "$DIR/admin.php" "$FTP_BASE/admin.php" -u "$USER:$PASS" && echo "  restored admin.php"
[ -f "$DIR/sitemap.xml" ] && curl -s -T "$DIR/sitemap.xml" "$FTP_BASE/sitemap.xml" -u "$USER:$PASS" && echo "  restored sitemap.xml"
[ -f "$DIR/robots.txt" ] && curl -s -T "$DIR/robots.txt" "$FTP_BASE/robots.txt" -u "$USER:$PASS" && echo "  restored robots.txt"
[ -f "$DIR/.htaccess" ] && curl -s -T "$DIR/.htaccess" "$FTP_BASE/.htaccess" -u "$USER:$PASS" && echo "  restored .htaccess"
[ -f "$DIR/tools/index.html" ] && curl -s -T "$DIR/tools/index.html" "$FTP_BASE/tools/index.html" -u "$USER:$PASS" && echo "  restored tools/index.html"
[ -f "$DIR/tools/personal-finance-calculator.html" ] && curl -s -T "$DIR/tools/personal-finance-calculator.html" "$FTP_BASE/tools/personal-finance-calculator.html" -u "$USER:$PASS" && echo "  restored tools/personal-finance-calculator.html"
echo "Restore complete."
