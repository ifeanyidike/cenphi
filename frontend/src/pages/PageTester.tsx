import React, { useState, useEffect, useRef } from "react";

// Types
interface Testimonial {
  id: string;
  content: string;
  author_name: string;
  author_email: string;
  author_title?: string;
  author_company?: string;
  rating?: number;
  video_url?: string;
  status: string;
  created_at: string;
}

interface OAuthStatus {
  google_drive: {
    client_id_set: boolean;
    client_secret_set: boolean;
    redirect_uri: string;
  };
  linkedin: {
    client_id_set: boolean;
    client_secret_set: boolean;
    redirect_uri: string;
  };
  environment: string;
  test_mode: boolean;
}

const PageTester: React.FC = () => {
  const [activeSection, setActiveSection] = useState("oauth-status");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sseConnection, setSseConnection] = useState<EventSource | null>(null);
  const [sseMessages, setSseMessages] = useState<string[]>([]);
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SSE connection helper for background job monitoring only
  const connectToSSE = (endpoint: string, label: string) => {
    if (sseConnection) {
      sseConnection.close();
    }

    const eventSource = new EventSource(`http://localhost:8081${endpoint}`);

    eventSource.onopen = () => {
      setSseMessages((prev) => [...prev, `${label} SSE Connected`]);
    };

    eventSource.onmessage = (event) => {
      setSseMessages((prev) => [...prev, `${label} Message: ${event.data}`]);
    };

    eventSource.addEventListener("connected", (event) => {
      setSseMessages((prev) => [...prev, `${label} Connected: ${event.data}`]);
    });

    eventSource.addEventListener("testimonial_update", (event) => {
      setSseMessages((prev) => [
        ...prev,
        `Testimonial Processing: ${event.data}`,
      ]);
    });

    eventSource.addEventListener("job_completed", (event) => {
      setSseMessages((prev) => [...prev, `Job Completed: ${event.data}`]);
    });

    eventSource.addEventListener("job_update", (event) => {
      setSseMessages((prev) => [...prev, `Job Update: ${event.data}`]);
    });

    eventSource.addEventListener("heartbeat", (event) => {
      setSseMessages((prev) => [...prev, `${label} Heartbeat`]);
    });

    eventSource.onerror = (error) => {
      setSseMessages((prev) => [
        ...prev,
        `${label} SSE Error: Connection failed`,
      ]);
    };

    setSseConnection(eventSource);
  };

  // Cleanup SSE connections on unmount
  useEffect(() => {
    return () => {
      if (sseConnection) {
        sseConnection.close();
      }
    };
  }, [sseConnection]);

  // Helper function for API calls
  const apiCall = async (
    endpoint: string,
    method: string = "GET",
    body?: any,
    headers?: any
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8081${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // OAuth Status Check
  const TestOAuthStatus = () => {
    const checkOAuthStatus = async () => {
      const data = await apiCall("/api/test/oauth/status", "GET");
      setOauthStatus(data);
    };

    return (
      <div>
        <h3>OAuth Configuration Status</h3>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}>
          Check if OAuth credentials are properly configured for testing.
        </p>
        <button onClick={checkOAuthStatus} disabled={loading}>
          Check OAuth Status
        </button>

        {oauthStatus && (
          <div style={{ marginTop: "20px" }}>
            <h4>Configuration Status:</h4>
            <div
              style={{
                padding: "15px",
                backgroundColor: "#f8f9fa",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            >
              <h5>Google Drive:</h5>
              <ul>
                <li>
                  Client ID:{" "}
                  {oauthStatus.google_drive.client_id_set
                    ? "✅ Set"
                    : "❌ Missing"}
                </li>
                <li>
                  Client Secret:{" "}
                  {oauthStatus.google_drive.client_secret_set
                    ? "✅ Set"
                    : "❌ Missing"}
                </li>
                <li>
                  Redirect URI:{" "}
                  {oauthStatus.google_drive.redirect_uri || "❌ Not set"}
                </li>
              </ul>

              <h5>LinkedIn:</h5>
              <ul>
                <li>
                  Client ID:{" "}
                  {oauthStatus.linkedin.client_id_set ? "✅ Set" : "❌ Missing"}
                </li>
                <li>
                  Client Secret:{" "}
                  {oauthStatus.linkedin.client_secret_set
                    ? "✅ Set"
                    : "❌ Missing"}
                </li>
                <li>
                  Redirect URI:{" "}
                  {oauthStatus.linkedin.redirect_uri || "❌ Not set"}
                </li>
              </ul>

              <p>
                <strong>Environment:</strong> {oauthStatus.environment}
              </p>
              <p>
                <strong>Test Mode:</strong>{" "}
                {oauthStatus.test_mode ? "✅ Enabled" : "❌ Disabled"}
              </p>
            </div>

            {(!oauthStatus.google_drive.client_id_set ||
              !oauthStatus.linkedin.client_id_set) && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "15px",
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffeaa7",
                  borderRadius: "4px",
                }}
              >
                <h5>Environment Variables Needed:</h5>
                <pre
                  style={{
                    fontSize: "12px",
                    backgroundColor: "#f8f9fa",
                    padding: "10px",
                  }}
                >
                  {`# Google Drive OAuth
GOOGLE_DRIVE_CLIENT_ID=your_google_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_google_client_secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:8081/api/google/oauth/callback

# LinkedIn OAuth  
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:8081/api/social/oauth/callback`}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Form Collection Test (unchanged from your original)
  const TestFormCollection = () => {
    const [formData, setFormData] = useState({
      content: "Amazing service! Very professional team.",
      author_name: "John Doe",
      author_email: "ifeanyi.dike@cenphi.io",
      author_title: "CEO",
      author_company: "Test Company",
      rating: 5,
      workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
    });

    const handleSubmit = async () => {
      await apiCall(
        `/api/workspaces/${formData.workspace_id}/testimonials/form`,
        "POST",
        formData
      );
    };

    const generateNewWorkspaceId = () => {
      setFormData({
        ...formData,
        workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
      });
    };

    return (
      <div>
        <h3>Form Collection Test</h3>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}>
          Standard REST API call. May trigger background AI processing that can
          be monitored via SSE.
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxWidth: "400px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              placeholder="Workspace ID"
              value={formData.workspace_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  workspace_id: e.target.value as any,
                })
              }
              style={{ flex: 1 }}
            />
            <button
              onClick={generateNewWorkspaceId}
              style={{ padding: "5px 10px" }}
            >
              New UUID
            </button>
          </div>
          <textarea
            placeholder="Testimonial content"
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value as any })
            }
            rows={4}
            required
          />
          <input
            placeholder="Author name"
            value={formData.author_name}
            onChange={(e) =>
              setFormData({ ...formData, author_name: e.target.value as any })
            }
            required
          />
          <input
            placeholder="Author email"
            type="email"
            value={formData.author_email}
            onChange={(e) =>
              setFormData({ ...formData, author_email: e.target.value as any })
            }
            required
          />
          <input
            placeholder="Author title (optional)"
            value={formData.author_title}
            onChange={(e) =>
              setFormData({ ...formData, author_title: e.target.value as any })
            }
          />
          <input
            placeholder="Author company (optional)"
            value={formData.author_company}
            onChange={(e) =>
              setFormData({
                ...formData,
                author_company: e.target.value as any,
              })
            }
          />
          <div>
            <label>Rating: {formData.rating}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.rating}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rating: parseInt(e.target.value as any),
                })
              }
            />
          </div>
          <button onClick={handleSubmit} disabled={loading}>
            Submit Testimonial
          </button>
        </div>
      </div>
    );
  };

  // Updated Google Drive Test with Test Endpoints
  const TestGoogleDrive = () => {
    const [driveData, setDriveData] = useState({
      workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
      file_ids: [
        "1eCVqZzxfB1SQtj82M8EqnIxISGDuFHJK",
        "1KwGz8gYEv-eXhC0Ay0iQUMdlazO--Qkc",
        "1hCI-ygsJEMYpdBGO8-CWfRXLYdbi7UuI",
      ],
      test_user_id: "6fe5d4ae-3627-4103-af42-39fb40cc0a12",
    });
    const [authUrl, setAuthUrl] = useState("");
    const [oauthCode, setOauthCode] = useState("");
    const [oauthState, setOauthState] = useState("");

    const getTestAuthUrl = async () => {
      const data = await apiCall(
        `/api/test/workspaces/${driveData.workspace_id}/google-drive/auth`,
        "GET"
      );
      setAuthUrl(data.auth_url || "");
      setDriveData({
        ...driveData,
        test_user_id:
          data.test_user_id || "6fe5d4ae-3627-4103-af42-39fb40cc0a12",
      });
    };

    const handleTestOAuthCallback = async () => {
      if (!oauthCode || !oauthState) {
        setError("Please provide both OAuth code and state");
        return;
      }

      await apiCall("/api/test/oauth/callback", "POST", {
        code: oauthCode,
        state: oauthState,
        platform: "google_drive",
        workspace_id: driveData.workspace_id,
        user_id: driveData.test_user_id,
      });
    };

    // Using your existing protected routes for actual Google Drive operations
    const listFiles = async () => {
      await apiCall(
        `/api/google/workspaces/${driveData.workspace_id}/drive/files`,
        "GET"
      );
    };

    const listTestimonialFiles = async () => {
      await apiCall(
        `/api/google/workspaces/${driveData.workspace_id}/drive/testimonial-files`,
        "GET"
      );
    };

    const importFromDrive = async () => {
      await apiCall(
        `/api/workspaces/${driveData.workspace_id}/testimonials/import/google-drive`,
        "POST",
        {
          file_ids: driveData.file_ids,
        }
      );
    };

    const generateNewWorkspaceId = () => {
      setDriveData({
        ...driveData,
        workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
      });
    };

    const generateNewFileIds = () => {
      setDriveData({
        ...driveData,
        file_ids: [crypto.randomUUID(), crypto.randomUUID()],
      });
    };

    return (
      <div>
        <h3>Google Drive Test (Test Mode)</h3>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}>
          Uses test endpoints that don't require authentication. Complete OAuth
          flow manually.
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxWidth: "400px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              placeholder="Workspace ID"
              value={driveData.workspace_id}
              onChange={(e) =>
                setDriveData({
                  ...driveData,
                  workspace_id: e.target.value as any,
                })
              }
              style={{ flex: 1 }}
            />
            <button
              onClick={generateNewWorkspaceId}
              style={{ padding: "5px 10px" }}
            >
              New UUID
            </button>
          </div>

          <h4>Step 1: Get Test Authorization URL</h4>
          <button onClick={getTestAuthUrl}>Get Test Auth URL</button>
          {authUrl && (
            <div
              style={{
                padding: "10px",
                backgroundColor: "#f0f8ff",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            >
              <p>
                <strong>Test User ID:</strong> {driveData.test_user_id}
              </p>
              <p>
                <strong>Authorization URL:</strong>
              </p>
              <a href={authUrl} target="_blank" rel="noopener noreferrer">
                {authUrl}
              </a>
              <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
                <strong>For testing:</strong> Click the link above and authorize
                the app. After authorization, you'll be redirected to your
                backend callback URL. The browser may show an error page, but
                check the URL bar for the 'code' and 'state' parameters to copy
                below.
                <br />
                <br />
                <strong>For production:</strong> Your backend should redirect
                back to your frontend after processing.
              </p>
            </div>
          )}

          <h4>Step 2: Complete OAuth (Manual)</h4>
          <input
            placeholder="OAuth Code (from callback URL)"
            value={oauthCode}
            onChange={(e) => setOauthCode(e.target.value as any)}
          />
          <input
            placeholder="OAuth State (from callback URL)"
            value={oauthState}
            onChange={(e) => setOauthState(e.target.value as any)}
          />
          <button
            onClick={handleTestOAuthCallback}
            disabled={!oauthCode || !oauthState}
          >
            Complete Test OAuth Callback
          </button>

          <hr style={{ margin: "20px 0" }} />
          <h4>Step 3: Use Google Drive (After OAuth)</h4>
          <p style={{ fontSize: "12px", color: "#888" }}>
            Note: These will require actual authentication tokens
          </p>
          <button onClick={listFiles}>List Drive Files</button>
          <button onClick={listTestimonialFiles}>List Testimonial Files</button>

          <div>
            <label>File IDs to import (comma separated):</label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                value={driveData.file_ids.join(", ")}
                onChange={(e) =>
                  setDriveData({
                    ...driveData,
                    file_ids: (e.target.value as any).split(", "),
                  })
                }
                placeholder="file_id_1, file_id_2"
                style={{ flex: 1 }}
              />
              <button
                onClick={generateNewFileIds}
                style={{ padding: "5px 10px" }}
              >
                New UUIDs
              </button>
            </div>
            <button onClick={importFromDrive}>Import Selected Files</button>
          </div>
        </div>
      </div>
    );
  };

  // Updated Social Sharing Test with Test Endpoints
  const TestSocialSharing = () => {
    const [shareData, setShareData] = useState({
      workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
      testimonial_id: "3b782f6c-e4ad-4d98-8bf7-9ee5320df9e9",
      platform: "linkedin",
      content: "Check out this amazing testimonial!",
      include_video: false,
      test_user_id: "6fe5d4ae-3627-4103-af42-39fb40cc0a12",
    });
    const [postId, setPostId] = useState(
      "f2c2ab15-5f67-4a3a-a084-1dd9505a1d7c"
    );
    const [authUrl, setAuthUrl] = useState("");
    const [oauthCode, setOauthCode] = useState("");
    const [oauthState, setOauthState] = useState("");

    const getTestAuthUrl = async () => {
      const data = await apiCall(
        `/api/test/workspaces/${shareData.workspace_id}/social/auth/${shareData.platform}`,
        "GET"
      );
      setAuthUrl(data.auth_url || "");
      setShareData({
        ...shareData,
        test_user_id:
          data.test_user_id || "6fe5d4ae-3627-4103-af42-39fb40cc0a12",
      });
    };

    const handleTestOAuthCallback = async () => {
      if (!oauthCode || !oauthState) {
        setError("Please provide both OAuth code and state");
        return;
      }

      await apiCall("/api/test/oauth/callback", "POST", {
        code: oauthCode,
        state: oauthState,
        platform: shareData.platform,
        workspace_id: shareData.workspace_id,
        user_id: shareData.test_user_id,
      });
    };

    // Using your existing social routes (note: auth middleware is commented out for testing)
    const getConnectedAccounts = async () => {
      await apiCall(
        `/api/workspaces/${shareData.workspace_id}/social/accounts`,
        "GET"
      );
    };

    const createPost = async () => {
      await apiCall(
        `/api/workspaces/${shareData.workspace_id}/social/${shareData.platform}/posts`,
        "POST",
        {
          testimonial_id: shareData.testimonial_id,
          content: shareData.content,
          include_video: shareData.include_video,
        }
      );
    };

    const getPostAnalytics = async () => {
      await apiCall(`/api/social/posts/${postId}/analytics`, "GET");
    };

    const syncMetrics = async () => {
      await apiCall(`/api/social/posts/${postId}/sync-metrics`, "POST");
    };

    const publishPost = async () => {
      await apiCall(`/api/social/posts/${postId}/publish`, "POST");
    };

    const generateNewWorkspaceId = () => {
      setShareData({
        ...shareData,
        workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
      });
    };

    const generateNewTestimonialId = () => {
      setShareData({
        ...shareData,
        testimonial_id: "3b782f6c-e4ad-4d98-8bf7-9ee5320df9e9",
      });
    };

    const generateNewPostId = () => {
      setPostId("f2c2ab15-5f67-4a3a-a084-1dd9505a1d7c");
    };

    return (
      <div>
        <h3>Social Sharing Test (Test Mode)</h3>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}>
          Uses test endpoints that don't require authentication. Complete OAuth
          flow manually.
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxWidth: "400px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              placeholder="Workspace ID"
              value={shareData.workspace_id}
              onChange={(e) =>
                setShareData({
                  ...shareData,
                  workspace_id: e.target.value as any,
                })
              }
              style={{ flex: 1 }}
            />
            <button
              onClick={generateNewWorkspaceId}
              style={{ padding: "5px 10px" }}
            >
              New UUID
            </button>
          </div>

          <select
            value={shareData.platform}
            onChange={(e) =>
              setShareData({ ...shareData, platform: e.target.value as any })
            }
          >
            <option value="linkedin">LinkedIn</option>
            <option value="facebook">Facebook</option>
            <option value="twitter">Twitter</option>
          </select>

          <h4>Step 1: Get Test Authorization URL</h4>
          <button onClick={getTestAuthUrl}>
            Get Test OAuth Authorization URL
          </button>
          {authUrl && (
            <div
              style={{
                padding: "10px",
                backgroundColor: "#f0f8ff",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            >
              <p>
                <strong>Test User ID:</strong> {shareData.test_user_id}
              </p>
              <p>
                <strong>Authorization URL:</strong>
              </p>
              <a href={authUrl} target="_blank" rel="noopener noreferrer">
                {authUrl}
              </a>
              <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
                <strong>For testing:</strong> Click the link above and authorize
                the app. After authorization, you'll be redirected to your
                backend callback URL. The browser may show an error page, but
                check the URL bar for the 'code' and 'state' parameters to copy
                below.
                <br />
                <br />
                <strong>For production:</strong> Your backend should redirect
                back to your frontend after processing.
              </p>
            </div>
          )}

          <h4>Step 2: Complete OAuth (Manual)</h4>
          <input
            placeholder="OAuth Code (from callback URL)"
            value={oauthCode}
            onChange={(e) => setOauthCode(e.target.value as any)}
          />
          <input
            placeholder="OAuth State (from callback URL)"
            value={oauthState}
            onChange={(e) => setOauthState(e.target.value as any)}
          />
          <button
            onClick={handleTestOAuthCallback}
            disabled={!oauthCode || !oauthState}
          >
            Complete Test OAuth Callback
          </button>

          <h4>Step 3: Verify Account Connection</h4>
          <button onClick={getConnectedAccounts}>Get Connected Accounts</button>

          <h4>Step 4: Create Social Post</h4>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              placeholder="Testimonial ID"
              value={shareData.testimonial_id}
              onChange={(e) =>
                setShareData({
                  ...shareData,
                  testimonial_id: e.target.value as any,
                })
              }
              style={{ flex: 1 }}
            />
            <button
              onClick={generateNewTestimonialId}
              style={{ padding: "5px 10px" }}
            >
              New UUID
            </button>
          </div>
          <textarea
            placeholder="Post content"
            value={shareData.content}
            onChange={(e) =>
              setShareData({ ...shareData, content: e.target.value as any })
            }
            rows={3}
          />
          <label>
            <input
              type="checkbox"
              checked={shareData.include_video}
              onChange={(e) =>
                setShareData({ ...shareData, include_video: e.target.checked })
              }
            />
            Include Video
          </label>
          <button onClick={createPost}>Create Social Post</button>

          <hr style={{ margin: "20px 0" }} />
          <h4>Post Management & Analytics</h4>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              placeholder="Post ID for analytics"
              value={postId}
              onChange={(e) => setPostId(e.target.value as any)}
              style={{ flex: 1 }}
            />
            <button onClick={generateNewPostId} style={{ padding: "5px 10px" }}>
              New UUID
            </button>
          </div>
          <button onClick={publishPost}>Publish Post</button>
          <button onClick={getPostAnalytics}>Get Post Analytics</button>
          <button onClick={syncMetrics}>Sync Metrics</button>
        </div>
      </div>
    );
  };

  // Keep all other test components unchanged...
  const TestEmailRequest = () => {
    const [emailData, setEmailData] = useState({
      workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
      contact_email: "aja.edward@cenphi.io",
      contact_name: "Desmond",
      company_name: "Cenphi",
      custom_message: "We would love your feedback!",
      sender_title: "Customer Success Manager",
      sender_company: "Test Company",
      template_name: "testimonial_request",
    });

    const sendSingleEmail = async () => {
      await apiCall("/api/mailing/testimonial-request", "POST", {
        workspace_id: emailData.workspace_id,
        contact_name: emailData.contact_name,
        contact_email: emailData.contact_email,
        company_name: emailData.company_name,
        custom_message: emailData.custom_message,
        sender_title: emailData.sender_title,
        sender_company: emailData.sender_company,
        template_name: emailData.template_name,
      });
    };

    const sendBulkEmails = async () => {
      await apiCall("/api/mailing/bulk-testimonial-request", "POST", {
        workspace_id: emailData.workspace_id,
        recipients: [
          {
            name: emailData.contact_name,
            email: "aja.edward@cenphi.io",
            company: emailData.company_name,
            project_name: "Test Project",
            customer_type: "premium",
          },
          {
            name: "Customer 2",
            email: "ifeanyidike87@gmail.com",
            company: "Company 2",
            project_name: "Another Project",
            customer_type: "standard",
          },
          {
            name: "Edward",
            email: "edwardaja750@gmail.com",
            company: "Cenphi",
            project_name: "Another Project",
            customer_type: "standard",
          },
        ],
        custom_message: emailData.custom_message,
        template_name: emailData.template_name,
        sender_title: emailData.sender_title,
        sender_company: emailData.sender_company,
        urgency_level: "medium",
        template_variation: "default",
      });
    };

    const getEmailLogs = async () => {
      await apiCall(
        "/api/mailing/get-logs/ae8614c4-7acb-45c3-b7e8-9cdbd60a736b",
        "GET"
      );
    };

    const testSendRequest = async () => {
      await apiCall(
        `/api/workspaces/${emailData.workspace_id}/testimonials/request`,
        "POST",
        {
          contact_email: emailData.contact_email,
          contact_name: emailData.contact_name,
          message: emailData.custom_message,
        }
      );
    };

    const generateNewWorkspaceId = () => {
      setEmailData({
        ...emailData,
        workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
      });
    };

    return (
      <div>
        <h3>Email Request Test</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxWidth: "400px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              placeholder="Workspace ID"
              value={emailData.workspace_id}
              onChange={(e) =>
                setEmailData({
                  ...emailData,
                  workspace_id: e.target.value as any,
                })
              }
              style={{ flex: 1 }}
            />
            <button
              onClick={generateNewWorkspaceId}
              style={{ padding: "5px 10px" }}
            >
              New UUID
            </button>
          </div>
          <input
            placeholder="Contact email"
            type="email"
            value={emailData.contact_email}
            onChange={(e) =>
              setEmailData({
                ...emailData,
                contact_email: e.target.value as any,
              })
            }
          />
          <input
            placeholder="Contact name"
            value={emailData.contact_name}
            onChange={(e) =>
              setEmailData({
                ...emailData,
                contact_name: e.target.value as any,
              })
            }
          />
          <input
            placeholder="Company name"
            value={emailData.company_name}
            onChange={(e) =>
              setEmailData({
                ...emailData,
                company_name: e.target.value as any,
              })
            }
          />
          <input
            placeholder="Sender title"
            value={emailData.sender_title}
            onChange={(e) =>
              setEmailData({
                ...emailData,
                sender_title: e.target.value as any,
              })
            }
          />
          <input
            placeholder="Sender company"
            value={emailData.sender_company}
            onChange={(e) =>
              setEmailData({
                ...emailData,
                sender_company: e.target.value as any,
              })
            }
          />
          <textarea
            placeholder="Custom message"
            value={emailData.custom_message}
            onChange={(e) =>
              setEmailData({
                ...emailData,
                custom_message: e.target.value as any,
              })
            }
            rows={3}
          />
          <select
            value={emailData.template_name}
            onChange={(e) =>
              setEmailData({
                ...emailData,
                template_name: e.target.value as any,
              })
            }
          >
            <option value="default">Default Template</option>
            <option value="urgent">Urgent Template</option>
            <option value="casual">Casual Template</option>
          </select>

          <button onClick={sendSingleEmail}>Send Single Email</button>
          <button onClick={sendBulkEmails}>
            Send Bulk Emails (3 recipients)
          </button>
          <button onClick={testSendRequest}>
            Send Request (Testimonial Route)
          </button>
          <button onClick={getEmailLogs}>Get Email Logs</button>
        </div>
      </div>
    );
  };

  // Other test components remain the same (AI Processing, File Upload, etc.)
  const TestAIProcessing = () => {
    const [aiData, setAiData] = useState({
      content: "This is an amazing product! I love using it every day.",
      brand_context: "We are a SaaS company focused on productivity tools.",
      audio_file: null as File | null,
      testimonial_id: "3b782f6c-e4ad-4d98-8bf7-9ee5320df9e9",
    });

    const analyzeSentiment = async () => {
      await apiCall("/api/sentiment", "POST", {
        text: aiData.content,
        brand_context: aiData.brand_context,
      });
    };

    const extractBrandContext = async () => {
      await apiCall("/api/brand-context", "POST", {
        testimonial_content: aiData.content,
      });
    };

    const extractHighlights = async () => {
      await apiCall("/api/highlights", "POST", {
        content: aiData.content,
        brand_context: aiData.brand_context,
      });
    };

    const polishText = async () => {
      await apiCall("/api/polish", "POST", {
        text: aiData.content,
        brand_context: aiData.brand_context,
      });
    };

    const generateContent = async () => {
      await apiCall("/api/generate-content", "POST", {
        prompt: `Generate a testimonial based on: ${aiData.content}`,
        brand_context: aiData.brand_context,
      });
    };

    const translateText = async () => {
      await apiCall("/api/translate", "POST", {
        text: aiData.content,
        target_language: "es",
      });
    };

    const transcribeAudio = async () => {
      if (!aiData.audio_file) {
        setError("Please select an audio file");
        return;
      }

      const formData = new FormData();
      formData.append("audio", aiData.audio_file);

      setLoading(true);
      try {
        const response = await fetch("http://localhost:8081/api/transcribe", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transcription failed");
      } finally {
        setLoading(false);
      }
    };

    const generateNewTestimonialId = () => {
      setAiData({
        ...aiData,
        testimonial_id: "3b782f6c-e4ad-4d98-8bf7-9ee5320df9e9",
      });
    };

    return (
      <div>
        <h3>AI Processing Test</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxWidth: "400px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              placeholder="Testimonial ID"
              value={aiData.testimonial_id}
              onChange={(e) =>
                setAiData({ ...aiData, testimonial_id: e.target.value as any })
              }
              style={{ flex: 1 }}
            />
            <button
              onClick={generateNewTestimonialId}
              style={{ padding: "5px 10px" }}
            >
              New UUID
            </button>
          </div>
          <textarea
            placeholder="Content to process"
            value={aiData.content}
            onChange={(e) =>
              setAiData({ ...aiData, content: e.target.value as any })
            }
            rows={4}
          />
          <textarea
            placeholder="Brand context"
            value={aiData.brand_context}
            onChange={(e) =>
              setAiData({ ...aiData, brand_context: e.target.value as any })
            }
            rows={3}
          />
          <input
            type="file"
            accept="audio/*"
            onChange={(e) =>
              setAiData({ ...aiData, audio_file: e.target.files?.[0] || null })
            }
          />

          <h4>AI Operations:</h4>
          <button onClick={analyzeSentiment}>Analyze Sentiment</button>
          <button onClick={extractBrandContext}>Extract Brand Context</button>
          <button onClick={extractHighlights}>Extract Highlights</button>
          <button onClick={polishText}>Polish Text</button>
          <button onClick={generateContent}>Generate Content</button>
          <button onClick={translateText}>Translate Text</button>
          <button onClick={transcribeAudio} disabled={!aiData.audio_file}>
            Transcribe Audio
          </button>
        </div>
      </div>
    );
  };

  const TestFileUpload = () => {
    const [uploadData, setUploadData] = useState({
      workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
    });

    const handleVideoUpload = async () => {
      const file = fileInputRef.current?.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("video", file);

      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:8081/api/workspaces/${uploadData.workspace_id}/testimonials/upload/video`,
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setLoading(false);
      }
    };

    const generateNewWorkspaceId = () => {
      setUploadData({
        ...uploadData,
        workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
      });
    };

    return (
      <div>
        <h3>File Upload Test</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxWidth: "400px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              placeholder="Workspace ID"
              value={uploadData.workspace_id}
              onChange={(e) =>
                setUploadData({
                  ...uploadData,
                  workspace_id: e.target.value as any,
                })
              }
              style={{ flex: 1 }}
            />
            <button
              onClick={generateNewWorkspaceId}
              style={{ padding: "5px 10px" }}
            >
              New UUID
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="video/*" />
          <button onClick={handleVideoUpload} disabled={loading}>
            Upload Video
          </button>
        </div>
      </div>
    );
  };

  const TestSSEMonitoring = () => {
    const startTestimonialProcessingMonitor = () => {
      connectToSSE(
        "/api/testimonials/processing/stream",
        "Testimonial Processing"
      );
    };

    const startAIJobMonitor = () => {
      connectToSSE("/api/jobs/stream", "AI Jobs");
    };

    const stopSSE = () => {
      if (sseConnection) {
        sseConnection.close();
        setSseConnection(null);
        setSseMessages((prev) => [...prev, "SSE Connection Closed"]);
      }
    };

    const [jobId, setJobId] = useState(crypto.randomUUID());

    const getJobStatus = async () => {
      await apiCall(`/api/jobs/${jobId}/status`, "GET");
    };

    const getProcessingStatus = async () => {
      await apiCall("/api/testimonials/processing/status", "GET");
    };

    const generateNewJobId = () => {
      setJobId(crypto.randomUUID());
    };

    return (
      <div>
        <h3>SSE Background Job Monitoring</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxWidth: "400px",
          }}
        >
          <h4>Connect to SSE Streams:</h4>
          <button onClick={startTestimonialProcessingMonitor}>
            Monitor Testimonial Processing
          </button>
          <button onClick={startAIJobMonitor}>Monitor AI Jobs</button>
          <button onClick={stopSSE}>Stop SSE Monitoring</button>

          <h4>Job Status (Regular API):</h4>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              placeholder="Job ID"
              value={jobId}
              onChange={(e) => setJobId(e.target.value as any)}
              style={{ flex: 1 }}
            />
            <button onClick={generateNewJobId} style={{ padding: "5px 10px" }}>
              New UUID
            </button>
          </div>
          <button onClick={getJobStatus}>Get AI Job Status</button>
          <button onClick={getProcessingStatus}>Get Processing Status</button>
        </div>
      </div>
    );
  };

  const TestDataFetching = () => {
    const [fetchData, setFetchData] = useState({
      workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
      testimonial_id: "3b782f6c-e4ad-4d98-8bf7-9ee5320df9e9",
    });

    const fetchTestimonials = () =>
      apiCall(`/api/testimonials/workspace/${fetchData.workspace_id}`, "GET");
    const fetchTestimonial = () =>
      apiCall(`/api/testimonials/${fetchData.testimonial_id}`, "GET");
    const fetchWorkspaceTestimonials = () =>
      apiCall(`/api/workspaces/${fetchData.workspace_id}/testimonials`, "GET");
    const getTestimonialStats = () =>
      apiCall(
        `/api/testimonials/workspace/${fetchData.workspace_id}/stats`,
        "GET"
      );
    const getHealth = () => apiCall("/api/health", "GET");

    const generateNewWorkspaceId = () => {
      setFetchData({
        ...fetchData,
        workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
      });
    };

    const generateNewTestimonialId = () => {
      setFetchData({
        ...fetchData,
        testimonial_id: "3b782f6c-e4ad-4d98-8bf7-9ee5320df9e9",
      });
    };

    return (
      <div>
        <h3>Data Fetching Test</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            maxWidth: "400px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              placeholder="Workspace ID"
              value={fetchData.workspace_id}
              onChange={(e) =>
                setFetchData({
                  ...fetchData,
                  workspace_id: e.target.value as any,
                })
              }
              style={{ flex: 1 }}
            />
            <button
              onClick={generateNewWorkspaceId}
              style={{ padding: "5px 10px" }}
            >
              New UUID
            </button>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              placeholder="Testimonial ID"
              value={fetchData.testimonial_id}
              onChange={(e) =>
                setFetchData({
                  ...fetchData,
                  testimonial_id: e.target.value as any,
                })
              }
              style={{ flex: 1 }}
            />
            <button
              onClick={generateNewTestimonialId}
              style={{ padding: "5px 10px" }}
            >
              New UUID
            </button>
          </div>
          <button onClick={fetchTestimonials}>
            Fetch Testimonials by Workspace
          </button>
          <button onClick={fetchTestimonial}>Fetch Single Testimonial</button>
          <button onClick={fetchWorkspaceTestimonials}>
            Fetch Workspace Testimonials
          </button>
          <button onClick={getTestimonialStats}>Get Testimonial Stats</button>
          <button onClick={getHealth}>Health Check</button>
        </div>
      </div>
    );
  };

  const sections = {
    "oauth-status": <TestOAuthStatus />,
    "form-collection": <TestFormCollection />,
    "google-drive": <TestGoogleDrive />,
    "social-sharing": <TestSocialSharing />,
    "email-request": <TestEmailRequest />,
    "ai-processing": <TestAIProcessing />,
    "file-upload": <TestFileUpload />,
    "sse-monitoring": <TestSSEMonitoring />,
    "data-fetching": <TestDataFetching />,
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Testimonial System Test Application</h1>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Testing backend API endpoints with proper OAuth support. Start with
        "OAuth Status" to check configuration, then test OAuth flows with the
        test endpoints.
      </p>

      {/* Navigation */}
      <div
        style={{
          marginBottom: "20px",
          borderBottom: "1px solid #ccc",
          paddingBottom: "10px",
        }}
      >
        {Object.keys(sections).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            style={{
              margin: "5px",
              padding: "10px",
              backgroundColor:
                activeSection === section ? "#007bff" : "#f8f9fa",
              color: activeSection === section ? "white" : "black",
              border: "1px solid #ddd",
              cursor: "pointer",
            }}
          >
            {section
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}
          </button>
        ))}
      </div>

      {/* Active Section */}
      <div style={{ marginBottom: "20px" }}>
        {sections[activeSection as keyof typeof sections]}
      </div>

      {/* Status */}
      {loading && (
        <div
          style={{
            padding: "10px",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
          }}
        >
          Loading...
        </div>
      )}
      {error && (
        <div
          style={{
            padding: "10px",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            color: "#721c24",
          }}
        >
          Error: {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div style={{ marginTop: "20px" }}>
          <h3>API Response:</h3>
          <pre
            style={{
              backgroundColor: "#f8f9fa",
              padding: "15px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              overflow: "auto",
              maxHeight: "400px",
            }}
          >
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      {/* SSE Messages */}
      {sseMessages.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>SSE Background Job Monitoring:</h3>
          <p style={{ fontSize: "12px", color: "#666", margin: "5px 0" }}>
            {sseConnection
              ? "🟢 SSE Connected - Monitoring background jobs"
              : "🔴 SSE Disconnected"}
          </p>
          <div
            style={{
              backgroundColor: "#e7f3ff",
              padding: "15px",
              border: "1px solid #b3d9ff",
              borderRadius: "4px",
              maxHeight: "200px",
              overflow: "auto",
            }}
          >
            {sseMessages.map((msg, index) => (
              <div
                key={index}
                style={{ marginBottom: "5px", fontSize: "12px" }}
              >
                {new Date().toLocaleTimeString()}: {msg}
              </div>
            ))}
          </div>
          <button
            onClick={() => setSseMessages([])}
            style={{ marginTop: "10px", padding: "5px 10px" }}
          >
            Clear SSE Messages
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div
        style={{
          marginTop: "20px",
          borderTop: "1px solid #ccc",
          paddingTop: "20px",
        }}
      >
        <h3>Quick Actions:</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => setResults(null)}>Clear Results</button>
          <button onClick={() => setError(null)}>Clear Error</button>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
          <button
            onClick={() => {
              if (sseConnection) {
                setSseMessages((prev) => [
                  ...prev,
                  "✓ SSE connection is active",
                ]);
              } else {
                setSseMessages((prev) => [
                  ...prev,
                  "✗ No SSE connection - use SSE Monitoring section to connect",
                ]);
              }
            }}
          >
            Check SSE Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageTester;
