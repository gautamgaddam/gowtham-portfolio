import { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  CircularProgress,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import ChatIcon from "@mui/icons-material/Chat";
import { useTheme } from "@mui/material/styles";

const ConversationHistory = ({ open, onClose, onSelect, activeConversationId, user }) => {
  const theme = useTheme();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

  useEffect(() => {
    if (open && user) {
      loadConversations(0);
    }
  }, [open, user]);

  const loadConversations = async (startOffset) => {
    if (!user) return;

    setLoading(true);
    try {
      // Get auth token
      const { createSupabaseClient } = await import("../lib/supabase");
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch(
        `/api/health-conversations?limit=${LIMIT}&offset=${startOffset}`,
        {
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (startOffset === 0) {
          setConversations(data.conversations);
        } else {
          setConversations(prev => [...prev, ...data.conversations]);
        }
        
        setHasMore(data.hasMore);
        setOffset(startOffset + LIMIT);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    loadConversations(offset);
  };

  const handleDelete = async (conversationId, event) => {
    event.stopPropagation();
    
    if (!window.confirm("Delete this conversation? This cannot be undone.")) {
      return;
    }

    try {
      const { createSupabaseClient } = await import("../lib/supabase");
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch(`/api/health-conversations/${conversationId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 400 },
          bgcolor: theme.palette.mode === "dark" ? "#1a1a1a" : "#fff",
          color: theme.palette.mode === "dark" ? "#e2e8f0" : "#1a1a1a",
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: "2px solid #000" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" fontWeight={900}>
            Conversation History
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto" }}>
        {loading && conversations.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : conversations.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <ChatIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No conversations yet
            </Typography>
          </Box>
        ) : (
          <List>
            {conversations.map((conv) => (
              <ListItem
                key={conv.id}
                disablePadding
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => handleDelete(conv.id, e)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
                sx={{
                  borderBottom: "1px solid",
                  borderColor: theme.palette.mode === "dark" ? "#333" : "#e0e0e0",
                  bgcolor: conv.id === activeConversationId
                    ? theme.palette.mode === "dark" ? "#2d2d2d" : "#f5f5f5"
                    : "transparent",
                }}
              >
                <ListItemButton onClick={() => onSelect(conv.id)}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {conv.title || "Untitled Conversation"}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                        <Chip
                          label={`${conv.message_count || 0} msgs`}
                          size="small"
                          sx={{ height: 20, fontSize: "0.7rem" }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(conv.updated_at)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {hasMore && (
        <Box sx={{ p: 2, borderTop: "2px solid #000" }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleLoadMore}
            disabled={loading}
            sx={{
              border: "2px solid #000",
              color: theme.palette.mode === "dark" ? "#fff" : "#000",
              "&:hover": {
                border: "2px solid #000",
                bgcolor: theme.palette.mode === "dark" ? "#2d2d2d" : "#f5f5f5",
              },
            }}
          >
            {loading ? <CircularProgress size={20} /> : "Load More"}
          </Button>
        </Box>
      )}
    </Drawer>
  );
};

export default ConversationHistory;
