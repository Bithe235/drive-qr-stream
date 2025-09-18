#!/bin/bash

# Google Cloud Load Balancer Setup Script for Appwrite Server
# Region: us-east1-b
# This script sets up a load balancer specifically for an Appwrite server

# Configuration variables
PROJECT_ID=""
REGION="us-east1"
ZONE="us-east1-b"
LOAD_BALANCER_NAME="appwrite-load-balancer"
BACKEND_SERVICE_NAME="appwrite-backend-service"
HEALTH_CHECK_NAME="appwrite-health-check"
INSTANCE_GROUP_NAME="appwrite-instance-group"
SSL_CERT_NAME="appwrite-ssl-cert"
DOMAIN_NAME=""
STATIC_IP_NAME="appwrite-static-ip"
APPWRITE_PORT="80"  # Appwrite default port

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if gcloud is installed
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install Google Cloud SDK first."
        exit 1
    fi
    print_status "gcloud CLI is installed"
}

# Function to authenticate with Google Cloud
authenticate() {
    print_status "Authenticating with Google Cloud..."
    gcloud auth login
    if [ $? -ne 0 ]; then
        print_error "Authentication failed"
        exit 1
    fi
    print_status "Authentication successful"
}

# Function to set project
set_project() {
    if [ -z "$PROJECT_ID" ]; then
        print_warning "PROJECT_ID not set. Fetching default project..."
        PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
        if [ -z "$PROJECT_ID" ]; then
            read -p "Enter your Google Cloud Project ID: " PROJECT_ID
        fi
    fi
    
    print_status "Setting project to $PROJECT_ID"
    gcloud config set project $PROJECT_ID
    if [ $? -ne 0 ]; then
        print_error "Failed to set project"
        exit 1
    fi
}

# Function to enable required APIs
enable_apis() {
    print_status "Enabling required APIs..."
    gcloud services enable compute.googleapis.com
    gcloud services enable networkservices.googleapis.com
    if [ $? -ne 0 ]; then
        print_error "Failed to enable required APIs"
        exit 1
    fi
    print_status "Required APIs enabled"
}

# Function to create static IP address
create_static_ip() {
    print_status "Creating static IP address..."
    gcloud compute addresses create $STATIC_IP_NAME \
        --region=$REGION \
        --project=$PROJECT_ID
    
    if [ $? -ne 0 ]; then
        print_error "Failed to create static IP address"
        exit 1
    fi
    
    # Get the reserved IP address
    STATIC_IP=$(gcloud compute addresses describe $STATIC_IP_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --format="value(address)")
    
    print_status "Static IP address created: $STATIC_IP"
}

# Function to create health check for Appwrite
create_health_check() {
    print_status "Creating health check for Appwrite..."
    gcloud compute health-checks create http $HEALTH_CHECK_NAME \
        --port=$APPWRITE_PORT \
        --request-path=/ \
        --check-interval=30s \
        --timeout=5s \
        --healthy-threshold=1 \
        --unhealthy-threshold=3 \
        --project=$PROJECT_ID
    
    if [ $? -ne 0 ]; then
        print_error "Failed to create health check"
        exit 1
    fi
    print_status "Health check created for Appwrite"
}

# Function to create instance template for Appwrite
create_instance_template() {
    print_status "Creating instance template for Appwrite..."
    
    # Create instance template for Appwrite
    gcloud compute instance-templates create appwrite-template \
        --machine-type=e2-medium \
        --image-family=ubuntu-2004-lts \
        --image-project=ubuntu-os-cloud \
        --boot-disk-size=20GB \
        --tags=http-server,https-server \
        --metadata=startup-script='#!/bin/bash
# Install Docker
apt-get update
apt-get install -y docker.io docker-compose

# Create docker-compose.yml for Appwrite
cat > /home/appwrite-docker-compose.yml << EOF
version: "3.8"

services:
  appwrite:
    image: appwrite/appwrite:latest
    container_name: appwrite
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /home/appwrite-data:/storage
      - /home/appwrite-config:/config
      - /home/appwrite-certificates:/certificates
    environment:
      - _APP_ENV=production
      - _APP_LOCALE=en
      - _APP_CONSOLE_WHITELIST_ROOT=enabled
      - _APP_CONSOLE_WHITELIST_EMAILS=
      - _APP_CONSOLE_WHITELIST_IPS=
      - _APP_SYSTEM_EMAIL_NAME=Appwrite
      - _APP_SYSTEM_EMAIL_ADDRESS=team@appwrite.io
      - _APP_SYSTEM_SECURITY_EMAIL_ADDRESS=certs@appwrite.io
      - _APP_SYSTEM_RESPONSE_FORMAT=application/json
      - _APP_OPTIONS_ABUSE=enabled
      - _APP_OPTIONS_FORCE_HTTPS=enabled
      - _APP_OPENSSL_KEY_V1=your-secret-key
      - _APP_DOMAIN=your-domain.com
      - _APP_DOMAIN_TARGET=your-domain.com
      - _APP_REDIS_HOST=redis
      - _APP_REDIS_PORT=6379
      - _APP_DB_HOST=mariadb
      - _APP_DB_PORT=3306
      - _APP_DB_SCHEMA=appwrite
      - _APP_DB_USER=user
      - _APP_DB_PASS=password
      - _APP_INFLUXDB_HOST=influxdb
      - _APP_INFLUXDB_PORT=8086
      - _APP_STATSD_HOST=telegraf
      - _APP_STATSD_PORT=8125
      - _APP_SMTP_HOST=
      - _APP_SMTP_PORT=
      - _APP_SMTP_SECURE=
      - _APP_SMTP_USERNAME=
      - _APP_SMTP_PASSWORD=
      - _APP_STORAGE_LIMIT=100000000
      - _APP_STORAGE_PREVIEW_LIMIT=20000000
      - _APP_STORAGE_ANTIVIRUS=disabled
      - _APP_STORAGE_ANTIVIRUS_HOST=clamav
      - _APP_STORAGE_ANTIVIRUS_PORT=3310
      - _APP_FUNCTIONS_SIZE_LIMIT=30000000
      - _APP_FUNCTIONS_TIMEOUT=900
      - _APP_FUNCTIONS_BUILD_TIMEOUT=900
      - _APP_FUNCTIONS_CONTAINERS=10
      - _APP_FUNCTIONS_CPUS=1
      - _APP_FUNCTIONS_MEMORY=512
      - _APP_FUNCTIONS_LOGS_RETENTION=1209600
      - _APP_USAGE_STATS=enabled
      - _APP_LOGGING_PROVIDER=stream
      - _APP_LOGGING_CONFIG={}
      - _APP_MAINTENANCE_INTERVAL=86400
      - _APP_MAINTENANCE_RETENTION_EXECUTION=1209600
      - _APP_MAINTENANCE_RETENTION_ABUSE=86400
      - _APP_MAINTENANCE_RETENTION_AUDIT=1209600
      - _APP_MAINTENANCE_RETENTION_USAGE=2592000

  mariadb:
    image: mariadb:10.7
    container_name: appwrite-mariadb
    restart: unless-stopped
    volumes:
      - /home/appwrite-mariadb:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=rootsecretpassword
      - MYSQL_DATABASE=appwrite
      - MYSQL_USER=user
      - MYSQL_PASSWORD=password
    command: mysqld --innodb-flush-method=fsync

  redis:
    image: redis:7.0-alpine
    container_name: appwrite-redis
    restart: unless-stopped
    volumes:
      - /home/appwrite-redis:/data

  influxdb:
    image: appwrite/influxdb:1.5.1
    container_name: appwrite-influxdb
    restart: unless-stopped
    volumes:
      - /home/appwrite-influxdb:/var/lib/influxdb

  telegraf:
    image: appwrite/telegraf:1.4.3
    container_name: appwrite-telegraf
    restart: unless-stopped
    environment:
      - _APP_INFLUXDB_HOST=influxdb

  clamav:
    image: appwrite/clamav:1.2.0
    container_name: appwrite-clamav
    restart: unless-stopped
    volumes:
      - /home/appwrite-clamav:/var/lib/clamav

  resque:
    image: appwrite/appwrite:latest
    container_name: appwrite-resque
    restart: unless-stopped
    command: resque
    depends_on:
      - redis
      - mariadb
    environment:
      - _APP_ENV=production
      - _APP_REDIS_HOST=redis
      - _APP_REDIS_PORT=6379
      - _APP_DB_HOST=mariadb
      - _APP_DB_PORT=3306
      - _APP_DB_SCHEMA=appwrite
      - _APP_DB_USER=user
      - _APP_DB_PASS=password

  worker-audits:
    image: appwrite/appwrite:latest
    container_name: appwrite-worker-audits
    restart: unless-stopped
    command: worker-audits
    depends_on:
      - redis
      - mariadb
    environment:
      - _APP_ENV=production
      - _APP_REDIS_HOST=redis
      - _APP_REDIS_PORT=6379
      - _APP_DB_HOST=mariadb
      - _APP_DB_PORT=3306
      - _APP_DB_SCHEMA=appwrite
      - _APP_DB_USER=user
      - _APP_DB_PASS=password

  worker-webhooks:
    image: appwrite/appwrite:latest
    container_name: appwrite-worker-webhooks
    restart: unless-stopped
    command: worker-webhooks
    depends_on:
      - redis
      - mariadb
    environment:
      - _APP_ENV=production
      - _APP_REDIS_HOST=redis
      - _APP_REDIS_PORT=6379
      - _APP_DB_HOST=mariadb
      - _APP_DB_PORT=3306
      - _APP_DB_SCHEMA=appwrite
      - _APP_DB_USER=user
      - _APP_DB_PASS=password

  worker-deletes:
    image: appwrite/appwrite:latest
    container_name: appwrite-worker-deletes
    restart: unless-stopped
    command: worker-deletes
    depends_on:
      - redis
      - mariadb
    environment:
      - _APP_ENV=production
      - _APP_REDIS_HOST=redis
      - _APP_REDIS_PORT=6379
      - _APP_DB_HOST=mariadb
      - _APP_DB_PORT=3306
      - _APP_DB_SCHEMA=appwrite
      - _APP_DB_USER=user
      - _APP_DB_PASS=password

  worker-certificates:
    image: appwrite/appwrite:latest
    container_name: appwrite-worker-certificates
    restart: unless-stopped
    command: worker-certificates
    depends_on:
      - redis
      - mariadb
    volumes: 
      - /home/appwrite-config:/storage/config
      - /home/appwrite-certificates:/storage/certificates
    environment:
      - _APP_ENV=production
      - _APP_REDIS_HOST=redis
      - _APP_REDIS_PORT=6379
      - _APP_DB_HOST=mariadb
      - _APP_DB_PORT=3306
      - _APP_DB_SCHEMA=appwrite
      - _APP_DB_USER=user
      - _APP_DB_PASS=password

  worker-functions:
    image: appwrite/appwrite:latest
    container_name: appwrite-worker-functions
    restart: unless-stopped
    command: worker-functions
    depends_on:
      - redis
      - mariadb
    environment:
      - _APP_ENV=production
      - _APP_REDIS_HOST=redis
      - _APP_REDIS_PORT=6379
      - _APP_DB_HOST=mariadb
      - _APP_DB_PORT=3306
      - _APP_DB_SCHEMA=appwrite
      - _APP_DB_USER=user
      - _APP_DB_PASS=password
      - _APP_FUNCTIONS_TIMEOUT=900
      - _APP_FUNCTIONS_BUILD_TIMEOUT=900
      - _APP_FUNCTIONS_CONTAINERS=10
      - _APP_FUNCTIONS_CPUS=1
      - _APP_FUNCTIONS_MEMORY=512

  worker-mails:
    image: appwrite/appwrite:latest
    container_name: appwrite-worker-mails
    restart: unless-stopped
    command: worker-mails
    depends_on:
      - redis
      - mariadb
    environment:
      - _APP_ENV=production
      - _APP_REDIS_HOST=redis
      - _APP_REDIS_PORT=6379
      - _APP_DB_HOST=mariadb
      - _APP_DB_PORT=3306
      - _APP_DB_SCHEMA=appwrite
      - _APP_DB_USER=user
      - _APP_DB_PASS=password

  worker-messaging:
    image: appwrite/appwrite:latest
    container_name: appwrite-worker-messaging
    restart: unless-stopped
    command: worker-messaging
    depends_on:
      - redis
      - mariadb
    environment:
      - _APP_ENV=production
      - _APP_REDIS_HOST=redis
      - _APP_REDIS_PORT=6379
      - _APP_DB_HOST=mariadb
      - _APP_DB_PORT=3306
      - _APP_DB_SCHEMA=appwrite
      - _APP_DB_USER=user
      - _APP_DB_PASS=password

  worker-migrations:
    image: appwrite/appwrite:latest
    container_name: appwrite-worker-migrations
    restart: unless-stopped
    command: worker-migrations
    depends_on:
      - redis
      - mariadb
    environment:
      - _APP_ENV=production
      - _APP_REDIS_HOST=redis
      - _APP_REDIS_PORT=6379
      - _APP_DB_HOST=mariadb
      - _APP_DB_PORT=3306
      - _APP_DB_SCHEMA=appwrite
      - _APP_DB_USER=user
      - _APP_DB_PASS=password

  worker-database:
    image: appwrite/appwrite:latest
    container_name: appwrite-worker-database
    restart: unless-stopped
    command: worker-database
    depends_on:
      - redis
      - mariadb
    environment:
      - _APP_ENV=production
      - _APP_REDIS_HOST=redis
      - _APP_REDIS_PORT=6379
      - _APP_DB_HOST=mariadb
      - _APP_DB_PORT=3306
      - _APP_DB_SCHEMA=appwrite
      - _APP_DB_USER=user
      - _APP_DB_PASS=password

  worker-builds:
    image: appwrite/appwrite:latest
    container_name: appwrite-worker-builds
    restart: unless-stopped
    command: worker-builds
    depends_on:
      - redis
      - mariadb
    environment:
      - _APP_ENV=production
      - _APP_REDIS_HOST=redis
      - _APP_REDIS_PORT=6379
      - _APP_DB_HOST=mariadb
      - _APP_DB_PORT=3306
      - _APP_DB_SCHEMA=appwrite
      - _APP_DB_USER=user
      - _APP_DB_PASS=password

  worker-usage:
    image: appwrite/appwrite:latest
    container_name: appwrite-worker-usage
    restart: unless-stopped
    command: worker-usage
    depends_on:
      - redis
      - mariadb
    environment:
      - _APP_ENV=production
      - _APP_REDIS_HOST=redis
      - _APP_REDIS_PORT=6379
      - _APP_DB_HOST=mariadb
      - _APP_DB_PORT=3306
      - _APP_DB_SCHEMA=appwrite
      - _APP_DB_USER=user
      - _APP_DB_PASS=password

  worker-usage-dump:
    image: appwrite/appwrite:latest
    container_name: appwrite-worker-usage-dump
    restart: unless-stopped
    command: worker-usage-dump
    depends_on:
      - redis
      - mariadb
    environment:
      - _APP_ENV=production
      - _APP_REDIS_HOST=redis
      - _APP_REDIS_PORT=6379
      - _APP_DB_HOST=mariadb
      - _APP_DB_PORT=3306
      - _APP_DB_SCHEMA=appwrite
      - _APP_DB_USER=user
      - _APP_DB_PASS=password

  worker-maintenance:
    image: appwrite/appwrite:latest
    container_name: appwrite-worker-maintenance
    restart: unless-stopped
    command: worker-maintenance
    depends_on:
      - redis
      - mariadb
    environment:
      - _APP_ENV=production
      - _APP_REDIS_HOST=redis
      - _APP_REDIS_PORT=6379
      - _APP_DB_HOST=mariadb
      - _APP_DB_PORT=3306
      - _APP_DB_SCHEMA=appwrite
      - _APP_DB_USER=user
      - _APP_DB_PASS=password

  worker-usage-cleanup:
    image: appwrite/appwrite:latest
    container_name: appwrite-worker-usage-cleanup
    restart: unless-stopped
    command: worker-usage-cleanup
    depends_on:
      - redis
      - mariadb
    environment:
      - _APP_ENV=production
      - _APP_REDIS_HOST=redis
      - _APP_REDIS_PORT=6379
      - _APP_DB_HOST=mariadb
      - _APP_DB_PORT=3306
      - _APP_DB_SCHEMA=appwrite
      - _APP_DB_USER=user
      - _APP_DB_PASS=password
EOF

# Start Appwrite
docker-compose -f /home/appwrite-docker-compose.yml up -d
'
    
    if [ $? -ne 0 ]; then
        print_error "Failed to create instance template"
        exit 1
    fi
    print_status "Instance template created"
}

# Function to create managed instance group
create_instance_group() {
    print_status "Creating managed instance group..."
    
    gcloud compute instance-groups managed create $INSTANCE_GROUP_NAME \
        --template=appwrite-template \
        --size=1 \
        --zone=$ZONE \
        --project=$PROJECT_ID
    
    if [ $? -ne 0 ]; then
        print_error "Failed to create managed instance group"
        exit 1
    fi
    print_status "Managed instance group created"
}

# Function to create backend service
create_backend_service() {
    print_status "Creating backend service..."
    gcloud compute backend-services create $BACKEND_SERVICE_NAME \
        --protocol=HTTP \
        --port-name=http \
        --health-checks=$HEALTH_CHECK_NAME \
        --global \
        --project=$PROJECT_ID
    
    if [ $? -ne 0 ]; then
        print_error "Failed to create backend service"
        exit 1
    fi
    print_status "Backend service created"
}

# Function to add backends to backend service
add_backends() {
    print_status "Adding backends to backend service..."
    gcloud compute backend-services add-backend $BACKEND_SERVICE_NAME \
        --instance-group=$INSTANCE_GROUP_NAME \
        --instance-group-zone=$ZONE \
        --balancing-mode=utilization \
        --max-utilization=0.8 \
        --global \
        --project=$PROJECT_ID
    
    if [ $? -ne 0 ]; then
        print_error "Failed to add backends to backend service"
        exit 1
    fi
    print_status "Backends added to backend service"
}

# Function to create URL map
create_url_map() {
    print_status "Creating URL map..."
    gcloud compute url-maps create $LOAD_BALANCER_NAME \
        --default-service=$BACKEND_SERVICE_NAME \
        --project=$PROJECT_ID
    
    if [ $? -ne 0 ]; then
        print_error "Failed to create URL map"
        exit 1
    fi
    print_status "URL map created"
}

# Function to create HTTP proxy
create_http_proxy() {
    print_status "Creating HTTP target proxy..."
    gcloud compute target-http-proxies create $LOAD_BALANCER_NAME-http-proxy \
        --url-map=$LOAD_BALANCER_NAME \
        --project=$PROJECT_ID
    
    if [ $? -ne 0 ]; then
        print_error "Failed to create HTTP target proxy"
        exit 1
    fi
    print_status "HTTP target proxy created"
}

# Function to create SSL certificate
create_ssl_certificate() {
    if [ -z "$DOMAIN_NAME" ]; then
        read -p "Enter your domain name for Appwrite (e.g., appwrite.yourdomain.com): " DOMAIN_NAME
    fi
    
    print_status "Creating SSL certificate for $DOMAIN_NAME..."
    
    # Create Google-managed SSL certificate
    gcloud compute ssl-certificates create $SSL_CERT_NAME \
        --domains=$DOMAIN_NAME \
        --project=$PROJECT_ID
    
    if [ $? -ne 0 ]; then
        print_error "Failed to create SSL certificate"
        exit 1
    fi
    print_status "SSL certificate created"
}

# Function to create HTTPS proxy
create_https_proxy() {
    print_status "Creating HTTPS target proxy..."
    gcloud compute target-https-proxies create $LOAD_BALANCER_NAME-https-proxy \
        --url-map=$LOAD_BALANCER_NAME \
        --ssl-certificates=$SSL_CERT_NAME \
        --project=$PROJECT_ID
    
    if [ $? -ne 0 ]; then
        print_error "Failed to create HTTPS target proxy"
        exit 1
    fi
    print_status "HTTPS target proxy created"
}

# Function to create forwarding rules
create_forwarding_rules() {
    print_status "Creating forwarding rules..."
    
    # HTTP forwarding rule (port 80)
    gcloud compute forwarding-rules create $LOAD_BALANCER_NAME-http-rule \
        --address=$STATIC_IP_NAME \
        --global \
        --target-http-proxy=$LOAD_BALANCER_NAME-http-proxy \
        --ports=80 \
        --project=$PROJECT_ID
    
    if [ $? -ne 0 ]; then
        print_error "Failed to create HTTP forwarding rule"
        exit 1
    fi
    
    # HTTPS forwarding rule (port 443)
    gcloud compute forwarding-rules create $LOAD_BALANCER_NAME-https-rule \
        --address=$STATIC_IP_NAME \
        --global \
        --target-https-proxy=$LOAD_BALANCER_NAME-https-proxy \
        --ports=443 \
        --project=$PROJECT_ID
    
    if [ $? -ne 0 ]; then
        print_error "Failed to create HTTPS forwarding rule"
        exit 1
    fi
    
    print_status "Forwarding rules created"
}

# Function to configure firewall rules
configure_firewall() {
    print_status "Configuring firewall rules..."
    
    # Allow HTTP traffic
    gcloud compute firewall-rules create allow-http \
        --allow tcp:80 \
        --target-tags=http-server \
        --project=$PROJECT_ID
    
    # Allow HTTPS traffic
    gcloud compute firewall-rules create allow-https \
        --allow tcp:443 \
        --target-tags=https-server \
        --project=$PROJECT_ID
    
    print_status "Firewall rules configured"
}

# Function to display load balancer information
display_info() {
    # Get the reserved IP address
    STATIC_IP=$(gcloud compute addresses describe $STATIC_IP_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --format="value(address)")
    
    print_status "Appwrite Load Balancer setup complete!"
    echo "----------------------------------------"
    echo "Load Balancer Name: $LOAD_BALANCER_NAME"
    echo "Region: $REGION"
    echo "Zone: $ZONE"
    echo "Static IP: $STATIC_IP"
    echo "Backend Service: $BACKEND_SERVICE_NAME"
    echo "Health Check: $HEALTH_CHECK_NAME"
    echo "SSL Certificate: $SSL_CERT_NAME"
    echo "Domain: $DOMAIN_NAME"
    echo "Appwrite URL: https://$DOMAIN_NAME"
    echo "----------------------------------------"
    print_status "Next steps:"
    print_status "1. Update your DNS to point $DOMAIN_NAME to $STATIC_IP"
    print_status "2. Wait for SSL certificate provisioning (can take up to 10 minutes)"
    print_status "3. Access your Appwrite instance at https://$DOMAIN_NAME"
}

# Main function
main() {
    print_status "Starting Google Cloud Load Balancer setup for Appwrite..."
    
    check_gcloud
    authenticate
    set_project
    enable_apis
    create_static_ip
    create_health_check
    create_instance_template
    create_instance_group
    create_backend_service
    add_backends
    create_url_map
    create_http_proxy
    create_ssl_certificate
    create_https_proxy
    create_forwarding_rules
    configure_firewall
    display_info
    
    print_status "Setup completed successfully!"
}

# Run the script
main