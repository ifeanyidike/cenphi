// src/components/capture-widget/steps/TextStep.tsx
import React, { useState } from "react";
import { useTestimonial } from "../contexts/TestimonialContext";
import Button from "../ui/Button";
import { TestimonialStep } from "../types";
import { useWebSocket } from "../hooks/useWebSocket";
import { generateSessionId } from "../utils/formatting";

const TextStep: React.FC = () => {
  const { state, dispatch } = useTestimonial();
  const {
    suggestedQuestions,
    isSubmitting,
    error,
    config,
    currentQuestionIndex,
  } = state;

  // Local state for form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sessionId] = React.useState(() => generateSessionId());

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "title") {
      setTitle(value);
    } else if (name === "content") {
      setContent(value);
    }
  };

  // Handle question suggestion click
  const handleQuestionClick = (question: string) => {
    const textArea = document.getElementById(
      "tw-testimonial-text"
    ) as HTMLTextAreaElement;
    const questionText = question.trim();

    // Add the question as a prompt
    if (textArea) {
      if (content) {
        setContent((prev) => `${prev}\n\n${questionText}\n`);
      } else {
        setContent(`${questionText}\n`);
      }

      // Focus the textarea
      setTimeout(() => {
        textArea.focus();
        textArea.selectionStart = textArea.value.length;
        textArea.selectionEnd = textArea.value.length;
      }, 0);
    }
  };

  const handleSubmit = async () => {
    // Validate input
    if (!content) {
      dispatch({ type: "SET_ERROR", payload: "Please enter your testimonial" });
      return;
    }

    // Send text submission via WebSocket
    const wsClient = useWebSocket(config.websocketBaseUrl, {
      onMessage: handleWebSocketMessage,
    });

    // Connect to WebSocket if not already connected
    if (!wsClient.isConnected()) {
      wsClient.connect(
        `/ws/interview/${config.campaignId}?session=${sessionId}`
      );
    }

    // Send the text submission
    wsClient.send({
      type: "text_submission",
      sessionId: sessionId,
      content: content,
      questionIdx: currentQuestionIndex,
    });

    // Reset content field for next question
    setContent("");
  };

  function handleWebSocketMessage(data: any) {
    if (data.type === "next_question" && data.question) {
      // Update question display
      dispatch({
        type: "SET_CURRENT_QUESTION_INDEX",
        payload: currentQuestionIndex + 1,
      });
    } else if (data.type === "interview_complete") {
      // All questions completed, move to review
      dispatch({ type: "SET_STEP", payload: TestimonialStep.Review });
    }
  }

  return (
    <div className="tw-step">
      <h3
        className="tw-label"
        style={{ fontSize: "19px", marginBottom: "20px", fontWeight: 600 }}
      >
        Write Your Testimonial
      </h3>

      <div className="tw-form-group">
        <label className="tw-label" htmlFor="tw-testimonial-title">
          Title
        </label>
        <input
          className="tw-input"
          type="text"
          id="tw-testimonial-title"
          name="title"
          placeholder="Summarize your experience in a title"
          value={title}
          onChange={handleInputChange}
        />
      </div>

      <div className="tw-form-group">
        <label className="tw-label" htmlFor="tw-testimonial-text">
          Your Experience
        </label>
        <textarea
          className="tw-textarea"
          id="tw-testimonial-text"
          name="content"
          placeholder="Share your experience here..."
          value={content}
          onChange={handleInputChange}
        />
      </div>

      <div className="tw-questions">
        <h4 className="tw-label" style={{ marginBottom: "12px" }}>
          Need inspiration? Try answering:
        </h4>
        <div className="tw-question-suggestions">
          {suggestedQuestions.map((question, index) => (
            <div
              key={index}
              className="tw-question-suggestion"
              onClick={() => handleQuestionClick(question)}
            >
              {question}
            </div>
          ))}
        </div>
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
          leftIcon="chevronLeft"
          onClick={() =>
            dispatch({ type: "SET_STEP", payload: TestimonialStep.Method })
          }
          disabled={isSubmitting}
        >
          Back
        </Button>

        <Button
          variant="primary"
          leftIcon="check"
          onClick={handleSubmit}
          isLoading={isSubmitting}
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default TextStep;
