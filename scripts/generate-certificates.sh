#!/bin/bash

# SSL/TLS Certificate Generation Script
# Generates self-signed certificates for development or production

set -e

CERT_DIR="./certs"
KEY_FILE="$CERT_DIR/private-key.pem"
CERT_FILE="$CERT_DIR/certificate.pem"
DAYS=365

echo "🔐 SSL/TLS Certificate Generation Script"
echo "========================================"

# Create certs directory if it doesn't exist
if [ ! -d "$CERT_DIR" ]; then
    mkdir -p "$CERT_DIR"
    echo "✓ Created directory: $CERT_DIR"
fi

# Check if certificates already exist
if [ -f "$KEY_FILE" ] && [ -f "$CERT_FILE" ]; then
    echo "⚠️  Certificates already exist:"
    echo "   - $KEY_FILE"
    echo "   - $CERT_FILE"
    read -p "Do you want to regenerate? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled. Using existing certificates."
        exit 0
    fi
fi

# Get domain name
read -p "Enter domain name (default: localhost): " DOMAIN
DOMAIN=${DOMAIN:-localhost}

echo "Generating SSL/TLS certificates for: $DOMAIN"
echo ""

# Generate private key (2048-bit RSA)
echo "1. Generating private key..."
openssl genrsa -out "$KEY_FILE" 2048
echo "✓ Private key generated: $KEY_FILE"

# Generate certificate signing request (CSR)
echo ""
echo "2. Generating certificate..."
openssl req -new -x509 \
    -key "$KEY_FILE" \
    -out "$CERT_FILE" \
    -days $DAYS \
    -subj "/C=VN/ST=HCM/L=HCM/O=Organization/CN=$DOMAIN"

echo "✓ Certificate generated: $CERT_FILE"
echo "✓ Valid for $DAYS days"

# Display certificate info
echo ""
echo "📋 Certificate Information:"
echo "============================"
openssl x509 -in "$CERT_FILE" -text -noout | grep -E "Subject:|Issuer:|Not Before|Not After|Public-Key"

# Set proper permissions
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"
echo ""
echo "✓ File permissions set correctly"

# Create environment configuration
echo ""
echo "3. Updating .env configuration..."
if [ -f ".env" ]; then
    if grep -q "SSL_KEY_PATH" .env; then
        sed -i.bak "s|SSL_KEY_PATH=.*|SSL_KEY_PATH=$(pwd)/$KEY_FILE|" .env
    else
        echo "SSL_KEY_PATH=$(pwd)/$KEY_FILE" >> .env
    fi
    
    if grep -q "SSL_CERT_PATH" .env; then
        sed -i.bak "s|SSL_CERT_PATH=.*|SSL_CERT_PATH=$(pwd)/$CERT_FILE|" .env
    else
        echo "SSL_CERT_PATH=$(pwd)/$CERT_FILE" >> .env
    fi
    echo "✓ .env file updated"
else
    cat > .env << EOF
# HTTPS/SSL Configuration
SSL_KEY_PATH=$(pwd)/$KEY_FILE
SSL_CERT_PATH=$(pwd)/$CERT_FILE
NODE_ENV=development
PORT=3000
EOF
    echo "✓ .env file created"
fi

echo ""
echo "✅ Certificate generation completed!"
echo ""
echo "📁 Certificate files:"
echo "   Private Key:  $KEY_FILE"
echo "   Certificate:  $CERT_FILE"
echo ""
echo "⚡ For production use:"
echo "   Use Let's Encrypt (free, auto-renews):"
echo "   sudo certbot certonly --standalone -d $DOMAIN"
echo ""
echo "🚀 To use these certificates with your application:"
echo "   NODE_ENV=development npm run start"
echo ""
echo "⚠️  Note: Self-signed certificates will trigger browser warnings."
echo "    For production, use certificates from trusted CAs like Let's Encrypt."
