// src/components/capture-widget/steps/InfoStep.tsx
import React, { useState, useRef } from "react";
import { useTestimonial } from "../contexts/TestimonialContext";
import Button from "../ui/Button";
import { TestimonialStep } from "../types";

const InfoStep: React.FC = () => {
  const { state, dispatch } = useTestimonial();
  const { authorInfo, error } = state;

  // References for file inputs
  const profileImageRef = useRef<HTMLInputElement>(null);

  // Local state for image preview
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    state.uploadedImageFile
      ? URL.createObjectURL(state.uploadedImageFile)
      : null
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    dispatch({
      type: "SET_AUTHOR_INFO",
      payload: {
        [name]: type === "checkbox" ? checked : value,
      },
    });
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const imageFile = e.target.files[0];
      dispatch({ type: "SET_UPLOADED_IMAGE", payload: imageFile });
      setImagePreviewUrl(URL.createObjectURL(imageFile));
    }
  };

  const handleRemoveImage = () => {
    dispatch({ type: "SET_UPLOADED_IMAGE", payload: null });
    setImagePreviewUrl(null);
    if (profileImageRef.current) {
      profileImageRef.current.value = "";
    }
  };

  const handleContinue = () => {
    // Validate inputs
    if (!authorInfo.name) {
      dispatch({ type: "SET_ERROR", payload: "Please enter your name" });
      return;
    }

    if (!authorInfo.email) {
      dispatch({
        type: "SET_ERROR",
        payload: "Please enter your email address",
      });
      return;
    }

    if (!authorInfo.consent) {
      dispatch({
        type: "SET_ERROR",
        payload: "Please consent to sharing your testimonial",
      });
      return;
    }

    // Clear any errors
    dispatch({ type: "SET_ERROR", payload: null });

    // Navigate to method selection
    dispatch({ type: "SET_STEP", payload: TestimonialStep.Method });
  };

  return (
    <div className="tw-step">
      <h3
        className="tw-label"
        style={{ fontSize: "19px", marginBottom: "20px", fontWeight: 600 }}
      >
        Tell us about yourself
      </h3>

      <div className="tw-form-group">
        <label className="tw-label" htmlFor="tw-name">
          Name
        </label>
        <input
          className="tw-input"
          type="text"
          id="tw-name"
          name="name"
          placeholder="Your full name"
          value={authorInfo.name}
          onChange={handleInputChange}
        />
      </div>

      <div className="tw-form-group">
        <label className="tw-label" htmlFor="tw-email">
          Email Address
        </label>
        <input
          className="tw-input"
          type="email"
          id="tw-email"
          name="email"
          placeholder="Your email address"
          value={authorInfo.email}
          onChange={handleInputChange}
        />
      </div>

      <div className="tw-form-group">
        <label className="tw-label" htmlFor="tw-company">
          Company
        </label>
        <input
          className="tw-input"
          type="text"
          id="tw-company"
          name="company"
          placeholder="Your company name"
          value={authorInfo.company}
          onChange={handleInputChange}
        />
      </div>

      <div className="tw-form-group">
        <label className="tw-label" htmlFor="tw-position">
          Position
        </label>
        <input
          className="tw-input"
          type="text"
          id="tw-position"
          name="position"
          placeholder="Your job title"
          value={authorInfo.position}
          onChange={handleInputChange}
        />
      </div>

      <div className="tw-form-group">
        <label className="tw-label" htmlFor="tw-profile-image">
          Profile Image (Optional)
        </label>
        <div
          className="tw-upload-container"
          onClick={() => profileImageRef.current?.click()}
        >
          <div className="tw-upload-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <div className="tw-upload-title">Upload Profile Image</div>
          <div className="tw-upload-hint">
            Drop your photo here or click to browse
          </div>
          <input
            ref={profileImageRef}
            type="file"
            className="tw-upload-input"
            id="tw-profile-image"
            accept="image/*"
            onChange={handleProfileImageChange}
          />
        </div>

        {imagePreviewUrl && (
          <div className="tw-uploaded-preview">
            <img
              src={imagePreviewUrl}
              className="tw-preview-img"
              alt="Profile"
            />
            <div className="tw-uploaded-overlay">
              <div className="tw-uploaded-action" onClick={handleRemoveImage}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="tw-checkbox-container">
        <input
          className="tw-checkbox"
          type="checkbox"
          id="tw-consent"
          name="consent"
          checked={authorInfo.consent}
          onChange={handleInputChange}
        />
        <label className="tw-checkbox-label" htmlFor="tw-consent">
          I consent to my testimonial being used in marketing materials and
          understand my profile information and image may be displayed alongside
          my testimonial.
        </label>
      </div>

      {error && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "rgba(220, 38, 38, 0.1)",
            color: "#DC2626",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      <div className="tw-footer">
        <Button
          variant="secondary"
          onClick={() => dispatch({ type: "CLOSE_MODAL" })}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          rightIcon="chevronRight"
          onClick={handleContinue}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default InfoStep;
