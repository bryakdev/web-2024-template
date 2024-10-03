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
} from "@mui/material";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

interface Message {
  text: string;
  isUser: boolean;
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
    background: linear-gradient(45deg, #2196f3, #21cbf3);
    color: white;
    &:hover {
      background: linear-gradient(45deg, #21cbf3, #2196f3);
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
  background-color: ${(props) => (props.$isUser ? "#e3f2fd" : "#f5f5f5")};
`;

function App() {
  const [messages, setMessages] = useLocalStorageState<Message[]>("chatHistory", {
    defaultValue: [],
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === "" || isLoading) return;

    const userMessage: Message = { text: input, isUser: true };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Prepare the chat history
      const chatHistory = messages.map(msg => ({
        role: msg.isUser ? "user" : "model",
        parts: msg.text,
      }));
      
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

  return (
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
          <div style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
            <CircularProgress />
          </div>
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
          disabled={isLoading}
          multiline
          maxRows={4}
        />
        <StyledButton
          variant="contained"
          onClick={handleSendMessage}
          disabled={isLoading}
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
      </InputContainer>
    </AppContainer>
  );
}

export default App;