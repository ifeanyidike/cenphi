#!/bin/bash
# scripts/redis-deploy.sh
set -e

echo "🚀 Starting Redis deployment..."

# Environment variable validation
if [ -z "$REDIS_PASSWORD" ]; then
    echo "❌ Error: REDIS_PASSWORD environment variable is not set!"
    echo "💡 Run: export REDIS_PASSWORD='your_password'"
    exit 1
fi

# Set defaults
REDIS_MAX_MEMORY=${REDIS_MAX_MEMORY:-800mb}
REDIS_PORT=${REDIS_PORT:-6379}

echo "📋 Redis Configuration:"
echo "  Memory Limit: $REDIS_MAX_MEMORY"
echo "  Port: $REDIS_PORT"
echo "  Password: [PROTECTED]"

# Create necessary directories
mkdir -p /home/opc/redis/{data,config,logs}
cd /home/opc

# Check if Redis is already running
REDIS_RUNNING=false
if docker ps | grep -q redis; then
    echo "⚠️ Redis container is already running"
    REDIS_RUNNING=true
    
    # Check if Redis has data
    DATA_EXISTS=$(docker exec -i $(docker ps -q -f name=redis) redis-cli -a "$REDIS_PASSWORD" --no-auth-warning DBSIZE 2>/dev/null || echo "0")
    if [ "$DATA_EXISTS" != "0" ]; then
        echo "📊 Redis contains $DATA_EXISTS keys - will preserve data"
        
        # Create backup before update
        echo "💾 Creating Redis backup..."
        docker exec $(docker ps -q -f name=redis) redis-cli -a "$REDIS_PASSWORD" --no-auth-warning BGSAVE
        sleep 2
        echo "✅ Backup initiated"
    fi
fi

# Create Redis configuration file
echo "📝 Creating Redis configuration..."
cat > /home/opc/redis.conf << EOFREDIS
# Redis Production Configuration for API Server + Cloud Run
bind 0.0.0.0
port 6379
timeout 300
tcp-keepalive 300

# Memory Management - Optimized for 1GB instance  
maxmemory $REDIS_MAX_MEMORY
maxmemory-policy allkeys-lru

# Persistence - CRITICAL for queue data
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Security for Cloud Run public access
requirepass $REDIS_PASSWORD
protected-mode yes
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
rename-command KEYS ""

# Performance and limits
tcp-backlog 511
databases 16
hz 10
maxclients 50
timeout 600

# Logging
loglevel notice

# Memory Optimization for Queue Usage
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64

# Streams Configuration (for queue implementation)
stream-node-max-bytes 4kb
stream-node-max-entries 100

# Security monitoring
slowlog-log-slower-than 10000
slowlog-max-len 128

EOFREDIS

chmod 644 /home/opc/redis.conf
echo "✅ Redis configuration created"

# Create Redis docker-compose file
echo "📋 Creating Redis Docker Compose configuration..."
cat > /home/opc/docker-compose.redis.yaml << EOFCOMPOSE
version: '3.8'

services:
  redis:
    image: redis:7.2-alpine
    container_name: cenphi_redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf:ro
    command: redis-server /usr/local/etc/redis/redis.conf
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "$REDIS_PASSWORD", "--no-auth-warning", "ping"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 30s

volumes:
  redis-data:
    name: cenphi_redis_data

EOFCOMPOSE

echo "✅ Docker Compose configuration created"

# Stop any existing containers
if [ "$REDIS_RUNNING" = true ]; then
    echo "🔄 Performing graceful Redis update..."
    REDIS_PASSWORD="$REDIS_PASSWORD" docker-compose -f docker-compose.redis.yaml down --timeout 30 2>/dev/null || true
else
    echo "🆕 Fresh Redis deployment..."
    REDIS_PASSWORD="$REDIS_PASSWORD" docker-compose -f docker-compose.redis.yaml down 2>/dev/null || true
    docker rm -f cenphi_redis 2>/dev/null || true
fi

# Pull latest Redis image
echo "📥 Pulling Redis image..."
docker pull redis:7.2-alpine

# Start Redis
echo "🚀 Starting Redis..."
REDIS_PASSWORD="$REDIS_PASSWORD" docker-compose -f docker-compose.redis.yaml up -d redis

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to start..."
for i in {1..60}; do
    if docker exec cenphi_redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning ping 2>/dev/null | grep -q PONG; then
        echo "✅ Redis is running and healthy"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Redis failed to start within 2 minutes"
        echo "📋 Redis container logs:"
        docker logs cenphi_redis
        exit 1
    fi
    echo "⏳ Attempt $i/60: Waiting for Redis..."
    sleep 2
done

# Verify Redis configuration
echo "🔍 Verifying Redis configuration..."
ACTUAL_MAXMEMORY=$(docker exec cenphi_redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning CONFIG GET maxmemory | tail -n1)
echo "✅ Redis max memory: $(echo $ACTUAL_MAXMEMORY | awk '{if($1==0) print "unlimited"; else printf "%.0f MB", $1/1024/1024}')"

# Get Redis info
REDIS_VERSION=$(docker exec cenphi_redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning INFO server | grep redis_version | cut -d: -f2 | tr -d '\r')
echo "📊 Redis version: $REDIS_VERSION"

# Test queue functionality
echo "🧪 Testing Redis queue functionality..."
TEST_KEY="deployment_test_$(date +%s)"

# Test basic operations
docker exec cenphi_redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning SET "$TEST_KEY" "deployment_successful" EX 60
RESULT=$(docker exec cenphi_redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning GET "$TEST_KEY")

if [[ "$RESULT" == *"deployment_successful"* ]]; then
    echo "✅ Basic Redis operations working"
else
    echo "❌ Redis operations test failed"
    exit 1
fi

# Test stream operations (for queue implementation)
STREAM_KEY="queue:deployment_test"
docker exec cenphi_redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning XADD "$STREAM_KEY" "*" test_field test_value
STREAM_LENGTH=$(docker exec cenphi_redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning XLEN "$STREAM_KEY")

if [ "$STREAM_LENGTH" -gt 0 ]; then
    echo "✅ Redis Streams working (queue functionality confirmed)"
    # Clean up test data
    docker exec cenphi_redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning DEL "$STREAM_KEY"
    docker exec cenphi_redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning DEL "$TEST_KEY"
else
    echo "❌ Redis Streams test failed"
    exit 1
fi

# Configure basic firewall
echo "🔥 Configuring firewall..."
if systemctl is-active --quiet firewalld 2>/dev/null; then
    sudo firewall-cmd --permanent --add-port=6379/tcp 2>/dev/null || true
    sudo firewall-cmd --reload 2>/dev/null || true
    echo "✅ Firewalld configured"
elif command -v ufw >/dev/null 2>&1; then
    sudo ufw allow 6379/tcp 2>/dev/null || true
    echo "✅ UFW configured"  
else
    sudo iptables -I INPUT -p tcp --dport 6379 -j ACCEPT 2>/dev/null || true
    echo "✅ Iptables configured"
fi

# Final health check
echo "🩺 Final Redis health check..."
REDIS_HEALTH=$(docker exec cenphi_redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning ping)
if [[ "$REDIS_HEALTH" == *"PONG"* ]]; then
    echo "✅ Redis deployment successful!"
else
    echo "❌ Redis health check failed"
    exit 1
fi

# Display connection information
REDIS_IP=$(curl -s http://169.254.169.254/opc/v1/instance/metadata 2>/dev/null | grep -o '"privateIp":"[^"]*"' | cut -d'"' -f4 || hostname -I | awk '{print $1}')
REDIS_PUBLIC_IP=$(curl -s http://169.254.169.254/opc/v1/instance/metadata 2>/dev/null | grep -o '"publicIp":"[^"]*"' | cut -d'"' -f4 || echo "N/A")

echo ""
echo "🔗 Redis Connection Information:"
echo "  Private IP: $REDIS_IP:6379"
echo "  Public IP: $REDIS_PUBLIC_IP:6379"
echo "  Password: [Use REDIS_PASSWORD environment variable]"
echo ""
echo "📝 API Server Environment:"
echo "  REDIS_HOST=$REDIS_IP"
echo "  REDIS_PORT=6379"
echo "  REDIS_PASSWORD=\$REDIS_PASSWORD"
echo ""
echo "📝 Cloud Run Environment:"  
echo "  REDIS_HOST=$REDIS_PUBLIC_IP"
echo "  REDIS_PORT=6379"
echo "  REDIS_PASSWORD=\$REDIS_PASSWORD"
echo ""

# Create monitoring script
echo "📊 Creating Redis monitoring script..."
cat > /home/opc/redis-monitor.sh << 'EOFMONITOR'
#!/bin/bash
REDIS_PASSWORD=${REDIS_PASSWORD}

echo "==================== Redis Status: $(date) ===================="
echo "Container Status: $(docker inspect --format='{{.State.Status}}' cenphi_redis 2>/dev/null || echo 'NOT FOUND')"

if docker ps | grep -q cenphi_redis; then
    echo "Memory Usage: $(docker stats --no-stream --format 'table {{.MemUsage}}' cenphi_redis)"
    echo ""
    echo "Redis Memory Info:"
    docker exec cenphi_redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning INFO memory | grep -E "(used_memory_human|maxmemory_human)"
    echo ""
    echo "Active Keys: $(docker exec cenphi_redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning DBSIZE)"
    echo "Queue Streams: $(docker exec cenphi_redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning KEYS 'queue:*' | wc -l)"
    echo "Scheduled Jobs: $(docker exec cenphi_redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning ZCARD scheduled_jobs 2>/dev/null || echo 0)"
    echo ""
    echo "Connection Stats:"
    docker exec cenphi_redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning INFO clients | grep -E "(connected_clients|blocked_clients)"
else
    echo "❌ Redis container not running!"
fi
echo "=================================================================="
EOFMONITOR

chmod +x /home/opc/redis-monitor.sh

echo "✅ Redis deployment completed successfully!"
echo "💡 Monitor Redis with: ./redis-monitor.sh"
echo "📋 View logs with: docker logs -f cenphi_redis"