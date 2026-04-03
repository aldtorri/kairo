#!/bin/sh
set -e
# Replace ${PORT} placeholder in nginx config with actual PORT value
sed -i "s/\${PORT}/${PORT:-80}/g" /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
