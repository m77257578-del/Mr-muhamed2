# Google AI Integration & Enhanced Platform Access

This plan outlines the integration of Google services into the platform to provide easier access via Google Sign-in and a smart AI assistant powered by Gemini with real-time search capabilities.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following features have been prioritized based on your feedback:
> 1. **Google Sign-in**: Streamlined authentication for students and teachers.
> 2. **Gemini Chatbot**: A multi-turn AI assistant with Google Search grounding for accurate, up-to-date information.
> 3. **Visual Style**: A modern, minimal "workbench" aesthetic using clean typography and high-contrast layouts.

- **Confirmed Decision**: The chatbot will be integrated as a collapsible side panel that can also be minimized to a floating bubble, ensuring it's available without obstructing course content.
- **Confirmed Decision**: Gemini Search Grounding will be used to provide students with verified external references during their study sessions.

## 1. Overview & Core Concept

- **What It Does**: Adds a secure "Login with Google" flow and a persistent AI learning assistant.
- **Target Audience**: Students seeking instant help and Teachers wanting to automate common FAQs.
- **Key Value**: Reduces login friction and provides a high-quality, grounded AI tutor directly within the learning environment.

## 2. User Experience & Visual Design

- **Key User Flows**:
    - **Login**: User clicks "الدخول بواسطة جوجل", selects their account, and is instantly logged into their profile.
    - **Study Help**: Student opens the AI panel, asks "اشرح لي قاعدة النحو في هذا الدرس مع أمثلة حديثة", and receives a response with Google Search citations.
- **Visual Identity**:
    - *Aesthetic*: Clean, laboratory-white surfaces with subtle hairline borders.
    - *Typography*: High-legibility Arabic fonts (Cairo/Plus Jakarta Sans) with monospace for technical snippets.
    - *Chat UI*: Minimalist message bubbles, smooth scroll animations, and clear source badges for search-grounded answers.

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Server-Side Gemini Calls**
    - *Chosen Approach*: All AI logic remains in `server.ts` using the `@google/genai` SDK.
    - *Why*: Ensures API keys are never exposed and allows for robust tool integration (like Google Search) which requires server-side handling.
- **Decision 2: Firebase Auth & Google Provider**
    - *Chosen Approach*: Use `signInWithPopup` for a seamless login experience within the platform.
    - *Why*: Most reliable method in an iframe-based preview environment.

## 4. Technical Architecture & Data Strategy

```unicode
┌───────────────────────────────────────────────────────────┐
│                    STUDENT / TEACHER UI                   │
│  ┌───────────────────┐           ┌─────────────────────┐  │
│  │   Auth Module     │           │   Gemini Chat UI    │  │
│  │ (Google Login)    │           │ (Floating / Sidebar)│  │
│  └─────────┬─────────┘           └──────────┬──────────┘  │
└────────────┼────────────────────────────────┼─────────────┘
             │                                │
             ▼                                ▼
┌───────────────────────────────────────────────────────────┐
│                        SERVER (Node.js)                   │
│  ┌───────────────────┐           ┌─────────────────────┐  │
│  │  Firebase Admin   │           │   Gemini SDK        │  │
│  │ (Session Verify)  │           │ (Search Grounding)  │  │
│  └─────────┬─────────┘           └──────────┬──────────┘  │
└────────────┼────────────────────────────────┼─────────────┘
             │                                │
             ▼                                ▼
┌───────────────────────┐           ┌───────────────────────┐
│      FIREBASE         │           │    GOOGLE SEARCH API  │
│ (Auth & Firestore)    │           │    (Grounding Data)   │
└───────────────────────┘           └───────────────────────┘
```

### Data Model & State
- **Auth State**: Global React context to track `user` object and `role`.
- **Chat History**: Persisted in component state and optionally synced to Firestore for multi-device continuity.
- **Search Citations**: Stored as `groundingMetadata` and rendered as interactive link badges.

### Implementation Sequence
1. **Auth Bridge**: Update `src/App.tsx` and `server.ts` to support Google Auth tokens.
2. **Gemini Route**: Implement `/api/gemini/chat` with history support and Search tool.
3. **Chat Component**: Build the `AIStudyBuddy` sidebar component with the minimal workbench style.
4. **Login UI**: Add the Google button and handle the redirect/popup logic.
