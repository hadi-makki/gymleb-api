# AI Chat Feature

This module provides an AI-powered fitness assistant using OpenAI's GPT-4 model. Users can ask questions about fitness, workouts, nutrition, and health, and receive personalized AI responses.

## Features

- **Fitness AI Assistant**: Specialized AI trained on fitness and health topics
- **Conversation Management**: Maintains conversation history and context
- **User Authentication**: Secure access for both members and managers
- **Cost Tracking**: Monitors API usage and costs
- **Metadata Support**: Additional context for better AI responses

## API Endpoints

### Send Message

- **POST** `/ai-chat/send-message`
- Send a message to the AI fitness assistant
- Requires authentication (member or manager)

### Get Conversations

- **GET** `/ai-chat/conversations`
- Retrieve user's conversation history
- Supports pagination with `limit` and `offset` query parameters

### Get Specific Conversation

- **GET** `/ai-chat/conversations/:conversationId`
- Get all messages from a specific conversation

### Delete Conversation

- **DELETE** `/ai-chat/conversations/:conversationId`
- Permanently delete a conversation and all its messages

### Get Chat Statistics

- **GET** `/ai-chat/stats`
- Retrieve usage statistics (conversations, messages, tokens, cost)

### Manager-Specific Endpoint

- **POST** `/ai-chat/send-message/manager`
- Send message with manager privileges (additional protection)

## Environment Variables

Add the following to your `.env` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## Database Schema

The feature creates a new table `ai_chat_conversations` with the following structure:

- `id`: Primary key (UUID)
- `memberId`: Foreign key to member table (nullable)
- `managerId`: Foreign key to manager table (nullable)
- `message`: The message content
- `role`: Message role (user/assistant)
- `conversationId`: UUID to group related messages
- `metadata`: JSON field for additional context
- `tokensUsed`: Number of tokens consumed
- `cost`: API call cost in USD
- `createdAt`: Message timestamp
- `updatedAt`: Last update timestamp

## Usage Examples

### Basic Message

```json
POST /ai-chat/send-message
{
  "message": "Can you help me create a workout plan for weight loss?",
  "metadata": {
    "fitnessLevel": "beginner",
    "goal": "weight_loss"
  }
}
```

### Continue Conversation

```json
POST /ai-chat/send-message
{
  "message": "What about cardio exercises?",
  "conversationId": "existing-conversation-uuid"
}
```

## AI System Prompt

The AI is configured with a specialized fitness system prompt that includes:

- Workout plan creation
- Nutrition advice
- Exercise form guidance
- Fitness goal setting
- Recovery recommendations
- Motivation and consistency tips

## Security Features

- JWT authentication required for all endpoints
- User isolation (users can only access their own conversations)
- Manager-specific endpoints with additional guards
- Input validation and sanitization

## Cost Management

- Tracks token usage for each API call
- Calculates approximate costs based on OpenAI pricing
- Provides usage statistics for monitoring

## Error Handling

- Graceful fallback when OpenAI service is unavailable
- Comprehensive error messages for debugging
- Rate limiting and throttling support

## Performance Considerations

- Database indexes on frequently queried fields
- Efficient conversation grouping and retrieval
- Pagination support for large conversation histories

## Future Enhancements

- Support for different AI models
- Advanced conversation analytics
- Integration with fitness tracking apps
- Multi-language support
- Voice message support
