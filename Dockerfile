# Use nginx to serve the static web application
FROM nginx:alpine

# Copy all static files to nginx html directory
COPY . /usr/share/nginx/html

# Expose port 80 (nginx default)
EXPOSE 80

# nginx runs automatically, no CMD needed
