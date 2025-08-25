# src/config/settings.py
import os
from typing import Optional
import base64

class Settings:
    """Application settings for gRPC AI Intelligence Service"""
    
    def __init__(self):
        # Server Configuration
        self.port: int = int(os.getenv("PORT", "50052"))
        self.max_workers: int = int(os.getenv("MAX_WORKERS", "10"))
        self.shutdown_grace_period: int = int(os.getenv("SHUTDOWN_GRACE_PERIOD", "10"))
        
        # Environment
        self.environment: str = os.getenv("ENVIRONMENT", "development")
        self.enable_reflection: bool = os.getenv("ENABLE_REFLECTION", "true").lower() in ("true", "1", "yes")
        
        # Logging
        self.log_level: str = os.getenv("LOG_LEVEL", "INFO")
        self.log_format: str = os.getenv(
            "LOG_FORMAT", 
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        
        # AI Service API Keys
        self.openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY")
        self.anthropic_api_key: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
        self.elevenlabs_api_key: Optional[str] = os.getenv("ELEVENLABS_API_KEY")
        
        # Oracle OCI Configuration
        self.oci_config_file: Optional[str] = os.getenv("OCI_CONFIG_FILE")
        self.oci_profile: str = os.getenv("OCI_PROFILE", "DEFAULT")
        
        # Health Check
        self.health_check_enabled: bool = os.getenv("HEALTH_CHECK_ENABLED", "true").lower() in ("true", "1", "yes")
        self.enable_service_health_checks: bool = os.getenv("ENABLE_SERVICE_HEALTH_CHECKS", "true").lower() in ("true", "1", "yes")

        # OCI Configuration - Using getenv which you said works
        self.oci_use_instance_principal: bool = os.getenv("OCI_USE_INSTANCE_PRINCIPAL", "false").lower() in ("true", "1", "yes")
        self.oci_bucket_name: str = os.getenv("OCI_BUCKET", "cenphibucket")
        self.oci_user: str = os.getenv("OCI_USER_OCID", "")
        self.oci_fingerprint: str = os.getenv("OCI_FINGERPRINT", "")
        self.oci_key_file: str = os.getenv("OCI_PRIVATE_KEY_PATH", "")
        self.oci_tenancy: str = os.getenv("OCI_TENANCY_OCID", "")
        self.oci_region: str = os.getenv("OCI_REGION", "")
        self.oci_namespace: str = os.getenv("OCI_NAMESPACE", "")
        
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.environment == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.environment == "development"
    
    @property
    def has_ai_keys(self) -> bool:
        """Check if AI service keys are available"""
        return bool(self.openai_api_key and self.elevenlabs_api_key)
    
    
    def setup_oci_key(self):
        print("Setting up oci keys\n")
        key_content = os.getenv("OCI_PRIVATE_KEY_BASE64")
        key_path = os.getenv('OCI_PRIVATE_KEY_PATH')
        if key_content and key_path:
            os.makedirs(os.path.dirname(key_path), exist_ok=True)
            decoded_key = base64.b64decode(key_content).decode("utf-8")
            with open(key_path, 'w') as f:
                f.write(decoded_key)
            os.chmod(key_path, 0o600)
            return key_path
        return None
    
    def debug_env_vars(self):
        """Debug helper to print environment variables"""
        print("=== Environment Variables Debug ===")
        for key in ["OCI_USER_OCID", "OCI_REGION", "OCI_FINGERPRINT", "OCI_TENANCY_OCID", "OCI_PRIVATE_KEY_PATH", "OCI_NAMESPACE"]:
            value = os.getenv(key, "NOT_SET")
            print(f"{key}: {value[:10]}{'...' if len(value) > 10 else ''}")
        print("===================================")


settings = Settings()