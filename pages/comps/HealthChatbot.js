import { useState, useEffect, useRef } from "react";
import { Box, TextField, IconButton, Typography, Chip } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SpaIcon from "@mui/icons-material/Spa";
import PersonIcon from "@mui/icons-material/Person";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { useTheme } from "@mui/material/styles";
import gsap, { Power3 } from "gsap";
import styles from "../../styles/health.module.css";

const STORAGE_KEY = "health_chat_history";
const MAX_HISTORY = 50;

const SUGGESTED_PROMPTS = [
  "I have a cold, what natural remedies can help?",
  "How can I improve my digestion naturally?",
  "What are natural ways to reduce stress and anxiety?",
  "Tell me about breathwork for better sleep",
];

const HealthChatbot = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const containerRef = useRef(null);

  // Load chat history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMessages(parsed);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  }, []);

  // Save chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        // Keep only last MAX_HISTORY messages
        const toSave = messages.slice(-MAX_HISTORY);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch (error) {
        console.error("Error saving chat history:", error);
      }
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // GSAP entrance animation on mount
  useEffect(() => {
    if (containerRef.current) {
      gsap.from(containerRef.current, {
        duration: 0.6,
        opacity: 0,
        y: 40,
        ease: Power3.easeOut,
      });
    }
  }, []);

  const sendMessage = async (messageText) => {
    const text = messageText || inputValue.trim();
    if (!text || isStreaming) return;

    const userMessage = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsStreaming(true);

    // Add empty assistant message for streaming
    const botMessage = { role: "assistant", content: "" };
    setMessages([...newMessages, botMessage]);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/health-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedContent += parsed.content;
                // Update the last message with accumulated content
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: accumulatedContent,
                  };
                  return updated;
                });
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request aborted");
      } else {
        console.error("Chat error:", error);
        // Update the bot message with error
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content:
              "I apologize, but I encountered an error. Please try again.",
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <Box ref={containerRef} className={styles.chatContainer}>
      {/* Disclaimer Banner */}
      <Box className={styles.disclaimerBanner}>
        <WarningAmberIcon />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Educational purposes only. Not a substitute for professional medical
          advice. Always consult a healthcare provider.
        </Typography>
      </Box>

      {/* Chat Header */}
      <Box className={styles.chatHeader}>
        <Typography variant="h1">🌿 Natural Health Advisor</Typography>
      </Box>

      {/* Messages List */}
      <Box className={styles.messageList}>
        {messages.length === 0 ? (
          <Box className={styles.emptyState}>
            <SpaIcon />
            <Typography variant="h3">
              Welcome to Natural Health Advisor
            </Typography>
            <Typography variant="body1">
              Ask me anything about natural remedies, holistic health, Ayurveda,
              and wellness practices. I&apos;m here to provide educational
              information about natural approaches to health.
            </Typography>
            <Box className={styles.suggestionChips}>
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <Chip
                  key={idx}
                  label={prompt}
                  onClick={() => handleSuggestionClick(prompt)}
                  className={styles.chip}
                />
              ))}
            </Box>
          </Box>
        ) : (
          messages.map((msg, idx) => (
            <Box
              key={idx}
              className={`${styles.messageBubble} ${
                msg.role === "user" ? styles.userBubble : styles.botBubble
              }`}
            >
              {msg.role === "assistant" && (
                <Box className={`${styles.avatar} ${styles.botAvatar}`}>
                  <SmartToyIcon fontSize="small" />
                </Box>
              )}
              <Box
                className={`${styles.messageContent} ${
                  msg.role === "user" ? styles.userContent : styles.botContent
                }`}
              >
                {msg.content || (
                  <Box className={styles.typingIndicator}>
                    <Box className={styles.typingDot} />
                    <Box className={styles.typingDot} />
                    <Box className={styles.typingDot} />
                  </Box>
                )}
              </Box>
              {msg.role === "user" && (
                <Box className={`${styles.avatar} ${styles.userAvatar}`}>
                  <PersonIcon fontSize="small" />
                </Box>
              )}
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Bar */}
      <Box className={styles.inputBar}>
        <TextField
          className={styles.inputField}
          multiline
          maxRows={4}
          placeholder="Ask about natural health remedies..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isStreaming}
          variant="outlined"
          sx={{
            "& .MuiOutlinedInput-root": {
              color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1a1a1a",
              backgroundColor:
                theme.palette.mode === "dark" ? "#0d0d0d" : "#fff",
              "& fieldset": {
                borderColor: "#333",
                borderWidth: "2px",
              },
              "&:hover fieldset": {
                borderColor: "#00e676",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#00e676",
              },
            },
          }}
        />
        <IconButton
          className={styles.sendButton}
          onClick={() => sendMessage()}
          disabled={!inputValue.trim() || isStreaming}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default HealthChatbot;
