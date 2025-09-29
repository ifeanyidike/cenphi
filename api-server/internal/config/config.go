package config

import (
	"fmt"
	"os"
	"sync"
	"time"
)

type Config struct {
	Server            ServerConfig
	Database          DatabaseConfig
	Redis             RedisConfig
	RabbitMQ          RabbitMQConfig
	AWS               AWSConfig
	OCI               OCIConfig
	Media             MediaConfig
	AI                AIService
	MediaIntelligence MediaIntelligenceConfig

	Social  SocialConfig
	Mailing EmailConfig
	Google  GoogleConfig
	Storage StorageConfig
}

type StorageConfig struct {
	Provider           string        `json:"provider"`             // "oci", "local", "aws"
	MaxUploadSize      int64         `json:"max_upload_size"`      // Max file size for uploads (500MB)
	MaxBodySize        int64         `json:"max_body_size"`        // Max HTTP body size (500MB)
	UploadTimeout      time.Duration `json:"upload_timeout"`       // Max time for upload operations (30min)
	ChunkSize          int           `json:"chunk_size"`           // Size of chunks for multipart upload (10MB)
	MaxSimpleUpload    int64         `json:"max_simple_upload"`    // Threshold for simple vs chunked upload (128MB)
	RetryAttempts      int           `json:"retry_attempts"`       // Number of retry attempts
	RetryDelay         time.Duration `json:"retry_delay"`          // Delay between retries
	TempDir            string        `json:"temp_dir"`             // Directory for temporary files
	CleanupAfterUpload bool          `json:"cleanup_after_upload"` // Clean up temp files after upload
}

// Extended your existing GRPCConfig
type MediaIntelligenceConfig struct {
	Address        string
	MaxRetries     int
	ApiKey         string
	RequestTimeout time.Duration
	UseTLS         bool
}

// Your existing configs remain the same...
type RabbitMQConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	VHost    string
}

type ServerConfig struct {
	Address           string        `json:"address"`
	MaxUploadSize     int64         `json:"max_upload_size"` // FIXED: Increased to 500MB
	CertFile          string        `json:"cert_file"`
	KeyFile           string        `json:"key_file"`
	Environment       string        `json:"environment"`
	FirebaseProjectID string        `json:"firebase_project_id"`
	BaseURL           string        `json:"base_url"`
	MaxBodySize       int64         `json:"max_body_size"` // FIXED: Increased to 500MB
	ReadTimeout       time.Duration `json:"read_timeout"`  // NEW: Explicit read timeout
	WriteTimeout      time.Duration `json:"write_timeout"` // NEW: Explicit write timeout
	IdleTimeout       time.Duration `json:"idle_timeout"`  // NEW: Explicit idle timeout
}

// type ServicesConfig struct {
// 	AIModels
// }

type AIService struct {
	OpenAIKey     string
	ClaudeKey     string
	AssemblyAIKey string
}

type DatabaseConfig struct {
	DSN string
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

type AWSConfig struct {
	Region     string
	BucketName string
}

type OCIConfig struct {
	Enabled              bool   `json:"enabled"`
	ConfigFilePath       string `json:"config_file_path"`
	ProfileName          string `json:"profile_name"`
	CompartmentOCID      string `json:"compartment_ocid"`
	Bucket               string `json:"bucket"`
	Namespace            string `json:"namespace"`
	Region               string `json:"region"`
	PublicEndpoint       string `json:"public_endpoint"`
	UseInstancePrincipal bool   `json:"use_instance_principal"`
	TenancyOCID          string `json:"tenancy_ocid"`
	UserOCID             string `json:"user_ocid"`
	Fingerprint          string `json:"fingerprint"`
	PrivateKeyPath       string `json:"private_key_path"`
	PrivateKeyPassphrase string `json:"private_key_passphrase"`

	// NEW: Timeout configurations for OCI operations
	RequestTimeout     time.Duration `json:"request_timeout"`      // Timeout for individual requests (10min)
	UploadTimeout      time.Duration `json:"upload_timeout"`       // Timeout for upload operations (30min)
	ChunkUploadTimeout time.Duration `json:"chunk_upload_timeout"` // Timeout for chunk uploads (5min)
	ConnectionTimeout  time.Duration `json:"connection_timeout"`   // Connection establishment timeout
	RetryAttempts      int           `json:"retry_attempts"`       // Number of retry attempts
	RetryDelay         time.Duration `json:"retry_delay"`          // Base delay between retries
}

type MediaConfig struct {
	TempDir           string
	OutputDir         string
	CleanupInterval   time.Duration
	CleanupAge        time.Duration
	MaxConcurrentJobs int
	MaxDurationSec    int
	MaxFileSizeMB     int
	QueueType         string
	JobTTL            time.Duration
	StorageType       string
	QueueKeyPrefix    string
}

type SocialConfig struct {
	LinkedIn    LinkedInOAuthConfig
	LinkedInAPI LinkedInAPIConfig
}

type LinkedInOAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURI  string
	Scopes       string
	FrontendURL  string
}

type LinkedInAPIConfig struct {
	BaseURL           string
	APIVersion        string
	RequestTimeout    time.Duration
	RequestsPerMinute int
	MaxRetries        int
	RetryDelay        time.Duration
}

type EmailConfig struct {
	Provider  string `mapstructure:"provider"` // "brevo", "sendgrid", "aws_ses"
	FromEmail string `mapstructure:"from_email"`
	FromName  string `mapstructure:"from_name"`

	// Provider-specific keys
	BrevoAPIKey    string `mapstructure:"brevo_api_key"`
	SendGridAPIKey string `mapstructure:"sendgrid_api_key"`
}

type GoogleConfig struct {
	Drive GoogleDriveConfig
}

type GoogleDriveConfig struct {
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
	RedirectURI  string `json:"redirect_uri"`
	Scopes       string `json:"scopes"`
}

var (
	once sync.Once
	Cfg  Config
)

func NewConfig() Config {
	once.Do(func() {
		// Determine environment
		environment := getEnvWithDefault("GO_ENV", "development")

		Cfg = Config{
			Server: ServerConfig{
				Address:           os.Getenv("SERVER_ADDRESS"),
				MaxUploadSize:     500 * 1024 * 1024, // 10MB
				Environment:       environment,
				FirebaseProjectID: os.Getenv("FIREBASE_PROJECT_ID"),
				BaseURL:           os.Getenv("BASE_URL"),
				MaxBodySize:       10 * 1024 * 1024, // 10MB
			},
			Storage: StorageConfig{
				Provider:           getEnvWithDefault("STORAGE_PROVIDER", "oci"),
				MaxUploadSize:      getEnvInt64("STORAGE_MAX_UPLOAD_SIZE", 500*1024*1024),    // 500MB
				MaxBodySize:        getEnvInt64("STORAGE_MAX_BODY_SIZE", 500*1024*1024),      // 500MB
				UploadTimeout:      getEnvDuration("STORAGE_UPLOAD_TIMEOUT", 30*time.Minute), // 30min
				ChunkSize:          getEnvInt("STORAGE_CHUNK_SIZE", 10*1024*1024),            // 10MB chunks
				MaxSimpleUpload:    getEnvInt64("STORAGE_MAX_SIMPLE_UPLOAD", 128*1024*1024),  // 128MB threshold
				RetryAttempts:      getEnvInt("STORAGE_RETRY_ATTEMPTS", 3),
				RetryDelay:         getEnvDuration("STORAGE_RETRY_DELAY", 5*time.Second),
				TempDir:            getEnvWithDefault("STORAGE_TEMP_DIR", os.TempDir()),
				CleanupAfterUpload: getEnvBool("STORAGE_CLEANUP_AFTER_UPLOAD", true),
			},
			Database: DatabaseConfig{
				DSN: fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
					os.Getenv("DB_USERNAME"),
					os.Getenv("DB_PASSWORD"),
					os.Getenv("DB_HOST"),
					os.Getenv("DB_PORT"),
					os.Getenv("DB_NAME"),
					os.Getenv("DB_SSL_MODE"),
				),
			},
			Redis: RedisConfig{
				Host:     os.Getenv("REDIS_HOST"),
				Port:     os.Getenv("REDIS_PORT"),
				Password: os.Getenv("REDIS_PASSWORD"),
				DB:       0,
			},
			RabbitMQ: RabbitMQConfig{
				Host:     getEnvWithDefault("RABBITMQ_HOST", "rabbitmq"),
				Port:     getEnvInt("RABBITMQ_PORT", 5672),
				User:     getEnvWithDefault("RABBITMQ_USER", "cenphi_user"),
				Password: getEnvWithDefault("RABBITMQ_PASSWORD", "cenphi_password"),
				VHost:    getEnvWithDefault("RABBITMQ_VHOST", "/"),
			},
			AWS: AWSConfig{
				Region:     os.Getenv("AWS_REGION"),
				BucketName: os.Getenv("AWS_BUCKET_NAME"),
			},
			OCI: OCIConfig{
				Enabled:              getEnvBool("OCI_STORAGE_ENABLED", false),
				ConfigFilePath:       os.Getenv("OCI_CONFIG_FILE"),
				ProfileName:          getEnvWithDefault("OCI_PROFILE", "DEFAULT"),
				CompartmentOCID:      os.Getenv("OCI_COMPARTMENT_OCID"),
				Bucket:               os.Getenv("OCI_BUCKET"),
				Namespace:            os.Getenv("OCI_NAMESPACE"),
				Region:               os.Getenv("OCI_REGION"),
				PublicEndpoint:       os.Getenv("OCI_PUBLIC_ENDPOINT"),
				UseInstancePrincipal: getEnvBool("OCI_USE_INSTANCE_PRINCIPAL", false),
				TenancyOCID:          os.Getenv("OCI_TENANCY_OCID"),
				UserOCID:             os.Getenv("OCI_USER_OCID"),
				Fingerprint:          os.Getenv("OCI_FINGERPRINT"),
				PrivateKeyPath:       os.Getenv("OCI_PRIVATE_KEY_PATH"),
				PrivateKeyPassphrase: os.Getenv("OCI_PRIVATE_KEY_PASSPHRASE"),

				// NEW: Timeout configurations
				RequestTimeout:     getEnvDuration("OCI_REQUEST_TIMEOUT", 10*time.Minute),
				UploadTimeout:      getEnvDuration("OCI_UPLOAD_TIMEOUT", 30*time.Minute),
				ChunkUploadTimeout: getEnvDuration("OCI_CHUNK_UPLOAD_TIMEOUT", 5*time.Minute),
				ConnectionTimeout:  getEnvDuration("OCI_CONNECTION_TIMEOUT", 30*time.Second),
				RetryAttempts:      getEnvInt("OCI_RETRY_ATTEMPTS", 3),
				RetryDelay:         getEnvDuration("OCI_RETRY_DELAY", 5*time.Second),
			},
			Media: MediaConfig{
				TempDir:           getEnvWithDefault("MEDIA_TEMP_DIR", os.TempDir()+"/media_processing"),
				OutputDir:         getEnvWithDefault("MEDIA_OUTPUT_DIR", os.TempDir()+"/media_output"),
				CleanupInterval:   getEnvDuration("MEDIA_CLEANUP_INTERVAL", 15*time.Minute),
				CleanupAge:        getEnvDuration("MEDIA_CLEANUP_AGE", 30*time.Minute),
				MaxConcurrentJobs: getEnvInt("MEDIA_MAX_CONCURRENT_JOBS", 3),
				MaxDurationSec:    getEnvInt("MEDIA_MAX_DURATION_SEC", 600),
				MaxFileSizeMB:     getEnvInt("MEDIA_MAX_FILE_SIZE_MB", 500),
				QueueType:         getEnvWithDefault("MEDIA_QUEUE_TYPE", "memory"),
				JobTTL:            getEnvDuration("MEDIA_JOB_TTL", 24*time.Hour),
				StorageType:       getEnvWithDefault("MEDIA_STORAGE_TYPE", "oci"),
			},

			AI: AIService{
				OpenAIKey:     os.Getenv("OPENAI_API_KEY"),
				ClaudeKey:     os.Getenv("ANTHROPIC_API_KEY"),
				AssemblyAIKey: os.Getenv("ASSEMBLYAI_API_KEY"),
			},
			MediaIntelligence: MediaIntelligenceConfig{
				Address:        os.Getenv("AI_SERVICE_ENDPOINT"),
				MaxRetries:     getEnvInt("AI_SERVICE_MAX_RETRIES", 5),
				RequestTimeout: getEnvDuration("AI_SERVICEREQUEST_TIMEOUT", 30*time.Minute),
				UseTLS:         os.Getenv("GRPC_USE_TLS") == "true",
			},
			Social: SocialConfig{
				// LinkedIn: LinkedInOAuthConfig{
				// 	ClientID:     os.Getenv("LINKEDIN_CLIENT_ID"),
				// 	ClientSecret: os.Getenv("LINKEDIN_CLIENT_SECRET"),
				// 	RedirectURI:  getEnvWithDefault("LINKEDIN_REDIRECT_URI", "http://localhost:8081/api/social/oauth/callback"),
				// 	Scopes:       getEnvWithDefault("LINKEDIN_SCOPES", "profile,w_member_social"),
				// 	FrontendURL:  getEnvWithDefault("FRONTEND_URL", "http://localhost:3001"),
				// },
				LinkedInAPI: LinkedInAPIConfig{
					BaseURL:           getEnvWithDefault("LINKEDIN_API_BASE_URL", "https://api.linkedin.com"),
					APIVersion:        getEnvWithDefault("LINKEDIN_API_VERSION", "v2"),
					RequestTimeout:    getEnvDuration("LINKEDIN_REQUEST_TIMEOUT", 30*time.Second),
					RequestsPerMinute: getEnvInt("LINKEDIN_REQUESTS_PER_MINUTE", 100),
					MaxRetries:        getEnvInt("LINKEDIN_MAX_RETRIES", 3),
					RetryDelay:        getEnvDuration("LINKEDIN_RETRY_DELAY", 5*time.Second),
				},
			},
			Mailing: EmailConfig{
				Provider:    "brevo",
				FromEmail:   "desmond@cenphi.io",
				FromName:    "Cenphi",
				BrevoAPIKey: os.Getenv("BREVO_API_KEY"),
			},
			Google: GoogleConfig{
				Drive: GoogleDriveConfig{
					ClientID:     os.Getenv("GOOGLE_DRIVE_CLIENT_ID"),
					ClientSecret: os.Getenv("GOOGLE_DRIVE_CLIENT_SECRET"),
					RedirectURI:  getEnvWithDefault("GOOGLE_DRIVE_REDIRECT_URI", "http://localhost:8081/api/google/oauth/callback"),
					Scopes:       getEnvWithDefault("GOOGLE_DRIVE_SCOPES", "https://www.googleapis.com/auth/drive.readonly"),
				},
			},
		}

	})
	return Cfg
}

func (c LinkedInOAuthConfig) GetAuthURL(state string) string {
	return fmt.Sprintf("https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=%s&redirect_uri=%s&state=%s&scope=%s",
		c.ClientID, c.RedirectURI, state, c.Scopes)
}
