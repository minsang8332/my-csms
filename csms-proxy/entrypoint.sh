#!/bin/bash
set -e

# Path to SSL certs
CERT_DIR="/etc/nginx/ssl"
mkdir -p "$CERT_DIR"

# Generate self-signed cert if none exists so Nginx can start
if [ ! -f "$CERT_DIR/fullchain.pem" ]; then
    echo "No SSL certificate found. Generating self-signed fallback certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$CERT_DIR/privkey.pem" \
        -out "$CERT_DIR/fullchain.pem" \
        -subj "/CN=localhost"
fi

if [ -n "$DOMAIN" ]; then
    echo "Configuring Nginx with domain: $DOMAIN"
    sed -i "s|server_name _;|server_name $DOMAIN;|g" /etc/nginx/nginx.conf
fi

if [ "$DOMAIN" = "localhost" ] || [ "$NODE_ENV" = "development" ]; then
    echo "Local development detected."
fi

# Start Nginx in background
nginx -g "daemon off;" &
NGINX_PID=$!

# Configure getssl if DOMAIN is provided
if [ -n "$DOMAIN" ] && [ -n "$LE_EMAIL" ]; then
    echo "Domain provided: $DOMAIN. Setting up getssl..."
    
    # Create config dir if not exists
    mkdir -p "/root/.getssl"
    
    # If global config doesn't exist, create it
    if [ ! -f "/root/.getssl/getssl.cfg" ]; then
        getssl -c "$DOMAIN" # This creates the global config and domain folder
    fi

    # Set email in global config
    sed -i "s|#ACCOUNT_EMAIL=.*|ACCOUNT_EMAIL=\"$LE_EMAIL\"|g" "/root/.getssl/getssl.cfg"
    sed -i "s|ACCOUNT_EMAIL=.*|ACCOUNT_EMAIL=\"$LE_EMAIL\"|g" "/root/.getssl/getssl.cfg"

    # Configure domain-specific getssl.cfg
    DOMAIN_CFG="/root/.getssl/$DOMAIN/getssl.cfg"
    if [ -f "$DOMAIN_CFG" ]; then
        # Set webroot path for ACME
        sed -i "s|#ACL=.*|ACL=('/var/www/html/.well-known/acme-challenge')|g" "$DOMAIN_CFG"
        sed -i "s|ACL=.*|ACL=('/var/www/html/.well-known/acme-challenge')|g" "$DOMAIN_CFG"
        
        sed -i "s|#USE_SINGLE_ACL=.*|USE_SINGLE_ACL=\"true\"|g" "$DOMAIN_CFG"
        sed -i "s|USE_SINGLE_ACL=.*|USE_SINGLE_ACL=\"true\"|g" "$DOMAIN_CFG"
        
        # Set reload command & cert locations
        sed -i "s|#DOMAIN_CERT_LOCATION=.*|DOMAIN_CERT_LOCATION=\"$CERT_DIR/fullchain.pem\"|g" "$DOMAIN_CFG"
        sed -i "s|DOMAIN_CERT_LOCATION=.*|DOMAIN_CERT_LOCATION=\"$CERT_DIR/fullchain.pem\"|g" "$DOMAIN_CFG"
        
        sed -i "s|#DOMAIN_KEY_LOCATION=.*|DOMAIN_KEY_LOCATION=\"$CERT_DIR/privkey.pem\"|g" "$DOMAIN_CFG"
        sed -i "s|DOMAIN_KEY_LOCATION=.*|DOMAIN_KEY_LOCATION=\"$CERT_DIR/privkey.pem\"|g" "$DOMAIN_CFG"
        
        sed -i "s|#RELOAD_CMD=.*|RELOAD_CMD=\"nginx -s reload\"|g" "$DOMAIN_CFG"
        sed -i "s|RELOAD_CMD=.*|RELOAD_CMD=\"nginx -s reload\"|g" "$DOMAIN_CFG"
    fi

    # Run initial getssl check in background after a short delay
    (
        sleep 5
        echo "Running initial getssl check..."
        getssl "$DOMAIN" || true
    ) &

    # Add cron job for monthly renewal (on 1st of every month at 03:00)
    echo "0 3 1 * * /usr/local/bin/getssl $DOMAIN > /var/log/getssl.log 2>&1" > /var/spool/cron/crontabs/root
    
    # Start crond
    crond
fi

# Wait for Nginx process
wait $NGINX_PID
