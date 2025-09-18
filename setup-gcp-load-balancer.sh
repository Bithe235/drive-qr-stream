#!/bin/bash

# Google Cloud Load Balancer Setup Script with SSL Certificate
# Region: us-east1-b
# This script automates the creation of a load balancer with SSL certificate

# Configuration variables
PROJECT_ID=""
REGION="us-east1"
ZONE="us-east1-b"
LOAD_BALANCER_NAME="app-load-balancer"
BACKEND_SERVICE_NAME="app-backend-service"
HEALTH_CHECK_NAME="app-health-check"
INSTANCE_GROUP_NAME="app-instance-group"
SSL_CERT_NAME="app-ssl-cert"
DOMAIN_NAME=""
STATIC_IP_NAME="app-static-ip"

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

# Function to create health check
create_health_check() {
    print_status "Creating health check..."
    gcloud compute health-checks create http $HEALTH_CHECK_NAME \
        --port=80 \
        --check-interval=30s \
        --timeout=5s \
        --healthy-threshold=1 \
        --unhealthy-threshold=3 \
        --project=$PROJECT_ID
    
    if [ $? -ne 0 ]; then
        print_error "Failed to create health check"
        exit 1
    fi
    print_status "Health check created"
}

# Function to create instance group (you'll need to customize this)
create_instance_group() {
    print_status "Creating managed instance group..."
    
    # Note: You'll need to have an instance template created first
    # This is a placeholder - you'll need to customize based on your setup
    
    # Example command (uncomment and customize):
    # gcloud compute instance-templates create app-template \
    #     --machine-type=e2-medium \
    #     --image-family=ubuntu-2004-lts \
    #     --image-project=ubuntu-os-cloud \
    #     --boot-disk-size=10GB \
    #     --tags=http-server,https-server \
    #     --metadata=startup-script='#!/bin/bash\napt-get update\napt-get install -y nginx'
    
    # gcloud compute instance-groups managed create $INSTANCE_GROUP_NAME \
    #     --template=app-template \
    #     --size=2 \
    #     --zone=$ZONE \
    #     --project=$PROJECT_ID
    
    print_warning "Instance group creation requires a pre-existing instance template."
    print_warning "Please create an instance template and managed instance group manually or customize this script."
    print_warning "For now, we'll proceed assuming the instance group exists."
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
    # Note: Replace with your actual instance group
    # gcloud compute backend-services add-backend $BACKEND_SERVICE_NAME \
    #     --instance-group=$INSTANCE_GROUP_NAME \
    #     --instance-group-zone=$ZONE \
    #     --balancing-mode=utilization \
    #     --max-utilization=0.8 \
    #     --global \
    #     --project=$PROJECT_ID
    
    print_warning "Adding backends requires an existing instance group."
    print_warning "Please uncomment and customize the add-backend command above."
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

# Function to create SSL certificate
create_ssl_certificate() {
    if [ -z "$DOMAIN_NAME" ]; then
        read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
    fi
    
    print_status "Creating SSL certificate for $DOMAIN_NAME..."
    
    # Option 1: Create self-managed SSL certificate (you need to provide cert files)
    print_warning "You have two options for SSL certificate:"
    print_warning "1. Upload your own certificate files"
    print_warning "2. Use Google-managed certificate (requires domain verification)"
    
    read -p "Choose option (1 or 2): " SSL_OPTION
    
    if [ "$SSL_OPTION" == "1" ]; then
        read -p "Enter path to certificate file: " CERT_FILE
        read -p "Enter path to private key file: " PRIVATE_KEY_FILE
        
        if [ ! -f "$CERT_FILE" ] || [ ! -f "$PRIVATE_KEY_FILE" ]; then
            print_error "Certificate or private key file not found"
            exit 1
        fi
        
        gcloud compute ssl-certificates create $SSL_CERT_NAME \
            --certificate=$CERT_FILE \
            --private-key=$PRIVATE_KEY_FILE \
            --project=$PROJECT_ID
    else
        # Option 2: Create Google-managed SSL certificate
        gcloud compute ssl-certificates create $SSL_CERT_NAME \
            --domains=$DOMAIN_NAME \
            --project=$PROJECT_ID
    fi
    
    if [ $? -ne 0 ]; then
        print_error "Failed to create SSL certificate"
        exit 1
    fi
    print_status "SSL certificate created"
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
    print_status "Load balancer setup complete!"
    echo "----------------------------------------"
    echo "Load Balancer Name: $LOAD_BALANCER_NAME"
    echo "Region: $REGION"
    echo "Zone: $ZONE"
    echo "Static IP: $STATIC_IP"
    echo "Backend Service: $BACKEND_SERVICE_NAME"
    echo "Health Check: $HEALTH_CHECK_NAME"
    echo "SSL Certificate: $SSL_CERT_NAME"
    echo "Domain: $DOMAIN_NAME"
    echo "----------------------------------------"
    print_status "Your load balancer is now ready to use!"
}

# Main function
main() {
    print_status "Starting Google Cloud Load Balancer setup..."
    
    check_gcloud
    authenticate
    set_project
    enable_apis
    create_static_ip
    create_health_check
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