#!/bin/sh
set -e

echo "ZAMMAD_BASE_URL: '$ZAMMAD_BASE_URL'"

if [ "$ZAMMAD_BASE_URL" = "https://your-zammad-instance.com" ]; then
  echo "Using fallback config (default URL)"
  cp /etc/nginx/conf.d/fallback.conf /etc/nginx/conf.d/default.conf
else
  # Robust host extraction using shell expansion
  ZAMMAD_HOST="$ZAMMAD_BASE_URL"
  ZAMMAD_HOST="${ZAMMAD_HOST#https://}"
  ZAMMAD_HOST="${ZAMMAD_HOST#http://}"
  ZAMMAD_HOST="${ZAMMAD_HOST%%/*}"
  echo "Computed ZAMMAD_HOST: '$ZAMMAD_HOST'"
  export ZAMMAD_HOST
  
  envsubst '${ZAMMAD_BASE_URL} ${ZAMMAD_HOST}' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf
  echo "Generated config preview:"
  cat /etc/nginx/conf.d/default.conf
fi

exec nginx -g 'daemon off;'
