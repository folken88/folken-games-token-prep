# Use nginx to serve the static web application
FROM nginx:alpine

# Copy only the static web app files (avoid shipping backend/data files)
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY borderStyles.js /usr/share/nginx/html/
COPY colorUtils.js /usr/share/nginx/html/
COPY faceDetection.js /usr/share/nginx/html/
COPY tokenGenerator.js /usr/share/nginx/html/
COPY logo_tkn8r.png /usr/share/nginx/html/
COPY token_thumbnail.jpg /usr/share/nginx/html/

# Nginx config (proxies /api to backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (nginx default)
EXPOSE 80

# nginx runs automatically, no CMD needed
