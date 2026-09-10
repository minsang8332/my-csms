FROM nginx:1.27-alpine

# Install dependencies (bash, curl, openssl for ssl gen, busybox cron is default in alpine but we ensure it works)
RUN apk add --no-cache bash curl openssl

# Download getssl and make it executable
RUN curl --silent https://raw.githubusercontent.com/srvrco/getssl/master/getssl > /usr/local/bin/getssl && \
    chmod 755 /usr/local/bin/getssl

# Copy config and entrypoint
COPY csms-proxy/nginx.conf /etc/nginx/nginx.conf
COPY csms-client/out/renderer/ /usr/share/nginx/html/
RUN mkdir -p /root/.getssl
COPY csms-proxy/getssl.cfg /root/.getssl/getssl.cfg
COPY csms-proxy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Webroot directory for ACME challenge
RUN mkdir -p /var/www/html

EXPOSE 80 443

ENTRYPOINT ["/entrypoint.sh"]
