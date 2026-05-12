import { useState, useEffect, useRef } from "react";
import { Box, TextField, IconButton, Typography, Chip } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoIcon from "@mui/icons-material/Info";
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

// Format message content with markdown-style formatting
const FormattedMessage = ({ content }) => {
  if (!content) return null;

  const formatText = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let currentList = null;
    let currentListType = null;

    lines.forEach((line, lineIndex) => {
      // Skip empty lines between elements but preserve them within text
      if (!line.trim()) {
        if (currentList) {
          elements.push(currentList);
          currentList = null;
          currentListType = null;
        }
        elements.push(<br key={`br-${lineIndex}`} />);
        return;
      }

      // Check for numbered list (1. 2. 3. etc.)
      const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
      if (numberedMatch) {
        const content = formatInlineText(numberedMatch[2]);
        if (currentListType !== 'ol') {
          if (currentList) {
            elements.push(currentList);
          }
          currentList = { type: 'ol', items: [] };
          currentListType = 'ol';
        }
        currentList.items.push(<li key={`li-${lineIndex}`}>{content}</li>);
        return;
      }

      // Check for bullet points (-, *, or •)
      const bulletMatch = line.match(/^[\-\*•]\s+(.+)/);
      if (bulletMatch) {
        const content = formatInlineText(bulletMatch[1]);
        if (currentListType !== 'ul') {
          if (currentList) {
            elements.push(currentList);
          }
          currentList = { type: 'ul', items: [] };
          currentListType = 'ul';
        }
        currentList.items.push(<li key={`li-${lineIndex}`}>{content}</li>);
        return;
      }

      // Close any open list
      if (currentList) {
        elements.push(currentList);
        currentList = null;
        currentListType = null;
      }

      // Check for headers (##)
      const headerMatch = line.match(/^(#{1,3})\s+(.+)/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const content = formatInlineText(headerMatch[2]);
        elements.push(
          <Typography 
            key={`h-${lineIndex}`} 
            variant={`h${Math.min(level + 4, 6)}`}
            sx={{ fontWeight: 700, mt: 1.5, mb: 0.5 }}
          >
            {content}
          </Typography>
        );
        return;
      }

      // Regular text with inline formatting
      elements.push(
        <Typography 
          key={`p-${lineIndex}`} 
          component="div" 
          sx={{ mb: 0.5, lineHeight: 1.6 }}
        >
          {formatInlineText(line)}
        </Typography>
      );
    });

    // Don't forget to push any remaining list
    if (currentList) {
      elements.push(currentList);
    }

    // Convert list objects to JSX
    return elements.map((el, idx) => {
      if (el && el.type === 'ol') {
        return (
          <Box 
            component="ol" 
            key={`ol-${idx}`}
            sx={{ 
              pl: 2.5, 
              my: 1,
              '& li': { 
                mb: 0.5,
                lineHeight: 1.6 
              } 
            }}
          >
            {el.items}
          </Box>
        );
      }
      if (el && el.type === 'ul') {
        return (
          <Box 
            component="ul" 
            key={`ul-${idx}`}
            sx={{ 
              pl: 2.5, 
              my: 1,
              '& li': { 
                mb: 0.5,
                lineHeight: 1.6 
              } 
            }}
          >
            {el.items}
          </Box>
        );
      }
      return el;
    });
  };

  // Format inline text (bold, italic, etc.)
  const formatInlineText = (text) => {
    const parts = [];
    let lastIndex = 0;
    
    // Match **bold** text
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      // Add bold text
      parts.push(
        <strong key={`b-${match.index}`} style={{ fontWeight: 700 }}>
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  return <Box className={styles.formattedContent}>{formatText(content)}</Box>;
};

const HealthChatbot = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const containerRef = useRef(null);
  const disclaimerRef = useRef(null);

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

  // Disclaimer popup animation on mount
  useEffect(() => {
    // Show disclaimer after a brief delay
    const showTimer = setTimeout(() => {
      setShowDisclaimer(true);
      
      // Animate in with cracker blast effect
      if (disclaimerRef.current) {
        gsap.fromTo(
          disclaimerRef.current,
          {
            scale: 0,
            rotation: -180,
            opacity: 0,
          },
          {
            scale: 1,
            rotation: 0,
            opacity: 1,
            duration: 0.6,
            ease: "back.out(2)",
          }
        );
      }
    }, 500);

    // Auto-hide after 5 seconds with blast effect
    const hideTimer = setTimeout(() => {
      if (disclaimerRef.current) {
        gsap.to(disclaimerRef.current, {
          scale: 0,
          rotation: 180,
          opacity: 0,
          duration: 0.4,
          ease: "back.in(2)",
          onComplete: () => setShowDisclaimer(false),
        });
      }
    }, 5500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const toggleDisclaimer = () => {
    if (showDisclaimer) {
      // Hide with animation
      if (disclaimerRef.current) {
        gsap.to(disclaimerRef.current, {
          scale: 0,
          rotation: 180,
          opacity: 0,
          duration: 0.4,
          ease: "back.in(2)",
          onComplete: () => setShowDisclaimer(false),
        });
      }
    } else {
      // Show with animation
      setShowDisclaimer(true);
      setTimeout(() => {
        if (disclaimerRef.current) {
          gsap.fromTo(
            disclaimerRef.current,
            {
              scale: 0,
              rotation: -180,
              opacity: 0,
            },
            {
              scale: 1,
              rotation: 0,
              opacity: 1,
              duration: 0.6,
              ease: "back.out(2)",
            }
          );
        }
      }, 10);
    }
  };

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
      {/* Disclaimer Info Icon with Tooltip */}
      <Box className={styles.disclaimerIconContainer}>
        <IconButton
          onClick={toggleDisclaimer}
          className={styles.disclaimerIcon}
          sx={{
            color: theme.palette.mode === "dark" ? "#ff6b35" : "#f7931e",
          }}
        >
          <InfoIcon fontSize="large" />
        </IconButton>
        
        {showDisclaimer && (
          <Box ref={disclaimerRef} className={styles.disclaimerTooltip}>
            <WarningAmberIcon />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Educational purposes only. Not a substitute for professional
              medical advice. Always consult a healthcare provider.
            </Typography>
          </Box>
        )}
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
                {msg.content ? (
                  msg.role === "assistant" ? (
                    <FormattedMessage content={msg.content} />
                  ) : (
                    msg.content
                  )
                ) : (
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
