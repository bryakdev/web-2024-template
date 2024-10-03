import { useState, useEffect, useRef } from "react";
import useLocalStorageState from "use-local-storage-state";
import styled from "styled-components";
import {
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Define the system prompt
const SYSTEM_PROMPT = `You are a world-class expert on personal development and act as a mentor for the user. Your role is to provide insightful, actionable advice to help the user grow personally and professionally. Draw upon your vast knowledge of psychology, productivity, goal-setting, and self-improvement techniques to offer tailored guidance. Be encouraging, empathetic, and push the user to reach their full potential. Always maintain a positive, growth-oriented mindset in your responses.`;

// Create a dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

interface Message {
  text: string;
  isUser: boolean;
}

// New interface for debug info
interface DebugInfo {
  error: string;
  details: any;
}

const AppContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
`;

const ChatContainer = styled(Paper)`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
`;

const MessageList = styled(List)`
  flex: 1;
  overflow-y: auto;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
`;

const StyledTextField = styled(TextField)`
  flex: 1;
`;

const StyledButton = styled(Button)`
  && {
    background: linear-gradient(45deg, #90caf9, #64b5f6);
    color: black;
    &:hover {
      background: linear-gradient(45deg, #64b5f6, #90caf9);
    }
  }
`;

const StyledListItem = styled(ListItem)<{ $isUser: boolean }>`
  && {
    justify-content: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
    padding: 0.5rem 0;
  }
`;

const MessageBubble = styled(Paper)<{ $isUser: boolean }>`
  padding: 0.5rem 1rem;
  max-width: 70%;
  background-color: ${(props) => (props.$isUser ? "#4a4a4a" : "#2a2a2a")};
`;

const DebugContainer = styled(Paper)`
  margin-top: 1rem;
  padding: 1rem;
  background-color: #2a2a2a;
  overflow-x: auto;
`;

const DebugOutput = ({ debugInfo }: { debugInfo: DebugInfo | null }) => {
  if (!debugInfo) return null;

  return (
    <DebugContainer>
      <Typography variant="h6" gutterBottom>
        Debug Information
      </Typography>
      <Typography variant="body2">Error: {debugInfo.error}</Typography>
      <Typography variant="body2">Details:</Typography>
      <pre>{JSON.stringify(debugInfo.details, null, 2)}</pre>
      <Button
        variant="contained"
        size="small"
        onClick={() => navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))}
      >
        Copy to Clipboard
      </Button>
    </DebugContainer>
  );
};

function App() {
  const [messages, setMessages] = useLocalStorageState<Message[]>("chatHistory", {
    defaultValue: [],
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [apiKey, setApiKey] = useLocalStorageState<string>("geminiApiKey", {
    defaultValue: "",
  });
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const chatContainerRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!apiKey) {
      setIsApiKeyDialogOpen(true);
    }
  }, [apiKey]);

  const handleSendMessage = async () => {
    if (input.trim() === "" || isLoading || !apiKey) return;

    const userMessage: Message = { text: input, isUser: true };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setIsLoading(true);
    setDebugInfo(null);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Prepare the chat history
      const chatHistory = [
        { role: "model", parts: SYSTEM_PROMPT },
        ...messages.map(msg => ({
          role: msg.isUser ? "user" : "model",
          parts: msg.text,
        }))
      ];
      
      // Add the new user message
      chatHistory.push({ role: "user", parts: input });

      // Start a new chat and send the entire history
      const chat = model.startChat({
        history: chatHistory,
      });

      const result = await chat.sendMessage(input);
      const response = await result.response;
      const text = response.text();

      const botMessage: Message = { text, isUser: false };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error generating response:", error);
      const errorMessage: Message = {
        text: "Sorry, I encountered an error. Please try again.",
        isUser: false,
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
      setDebugInfo({
        error: error instanceof Error ? error.message : String(error),
        details: error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleApiKeySubmit = (newApiKey: string) => {
    setApiKey(newApiKey);
    setIsApiKeyDialogOpen(false);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AppContainer>
        <Typography variant="h4" gutterBottom>
          Gemini Chat Bot
        </Typography>
        <ChatContainer>
          <MessageList ref={chatContainerRef}>
            {messages.map((message, index) => (
              <StyledListItem key={index} $isUser={message.isUser}>
                <MessageBubble $isUser={message.isUser}>
                  <ListItemText primary={message.text} />
                </MessageBubble>
              </StyledListItem>
            ))}
          </MessageList>
          {isLoading && (
            <Box display="flex" justifyContent="center" padding={1}>
              <CircularProgress />
            </Box>
          )}
        </ChatContainer>
        <InputContainer>
          <StyledTextField
            inputRef={inputRef}
            variant="outlined"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading || !apiKey}
            multiline
            maxRows={4}
          />
          <StyledButton
            variant="contained"
            onClick={handleSendMessage}
            disabled={isLoading || !apiKey}
          >
            Send
          </StyledButton>
          <StyledButton
            variant="outlined"
            onClick={handleClearChat}
            disabled={isLoading}
          >
            Clear Chat
          </StyledButton>
          <StyledButton
            variant="outlined"
            onClick={() => setIsApiKeyDialogOpen(true)}
          >
            Set API Key
          </StyledButton>
        </InputContainer>
        <DebugOutput debugInfo={debugInfo} />
      </AppContainer>
      <ApiKeyDialog
        open={isApiKeyDialogOpen}
        onClose={() => setIsApiKeyDialogOpen(false)}
        onSubmit={handleApiKeySubmit}
        initialValue={apiKey}
      />
    </ThemeProvider>
  );
}

interface ApiKeyDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (apiKey: string) => void;
  initialValue: string;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ open, onClose, onSubmit, initialValue }) => {
  const [apiKey, setApiKey] = useState(initialValue);

  const handleSubmit = () => {
    onSubmit(apiKey);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Enter Gemini API Key</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="API Key"
          type="password"
          fullWidth
          variant="outlined"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default App;