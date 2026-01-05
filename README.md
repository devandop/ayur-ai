# AyurAI


![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Motia](https://img.shields.io/badge/Motia-Backend-blue?style=flat-square)
![Mux](https://img.shields.io/badge/Mux-Video-red?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)

---

## What I Built

**AyurAI** is an AI-powered Ayurvedic wellness platform that bridges ancient holistic healthcare with modern technology. The platform provides three core services:

1. **AI Voice Assistant** - Users can have natural voice conversations with an AI wellness advisor, available 24/7, to get personalized Ayurvedic guidance for their health concerns.

2. **Practitioner Appointments** - A complete appointment booking system where users can schedule consultations with certified Ayurvedic doctors, view availability, and track their wellness journey.

3. **Educational Video Library** - A curated collection of Ayurvedic wellness videos with Netflix-quality streaming, progress tracking, and resume-from-where-you-left-off functionality - all powered by Mux.

The platform includes both a **User Dashboard** (for tracking wellness journey, appointments, and video progress) and an **Admin Dashboard** (for managing doctors, uploading videos, and viewing analytics).

---



### Test Credentials

To explore the full application:

**User Account:**
- Sign up with any email via Clerk authentication
- Explore the dashboard, book appointments, and watch videos

**Admin Access:**
- Contact for admin demo access
- Admin dashboard includes doctor management, video uploads, and analytics

---

## The Story Behind It

### The Problem

Ayurveda, one of the world's oldest holistic healing systems, has helped millions achieve wellness for over 5,000 years. Yet in today's fast-paced world, accessing quality Ayurvedic guidance remains a challenge:

- **Accessibility** - Qualified Ayurvedic practitioners are scarce and often expensive
- **Availability** - Traditional consultations require scheduling and travel
- **Education** - Authentic Ayurvedic knowledge is scattered and hard to find
- **Continuity** - No easy way to track your wellness journey over time

### The Solution

I built AyurAI to democratize access to Ayurvedic wellness. By combining AI technology with professional practitioner access and educational content, users can:

- Get instant wellness guidance through voice conversations at any time
- Book real consultations when they need deeper professional advice
- Learn at their own pace through a curated video library
- Track their entire wellness journey in one unified platform

### What Makes It Special

AyurAI isn't just another health app. It's designed with the philosophy that **technology should enhance, not replace, traditional wisdom**. The AI assistant is trained to provide guidance rooted in authentic Ayurvedic principles, while the practitioner booking system ensures users can always access human expertise when needed.

The video library isn't just content - it's a learning journey with progress tracking, so users can systematically deepen their understanding of Ayurvedic practices.

---

## Technical Highlights

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 15)                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Pages/    │  │ Components/ │  │   Hooks/    │  │  Actions/   │        │
│  │   Routes    │  │     UI      │  │ React Query │  │  Server     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│  Authentication: Clerk  │  Styling: Tailwind CSS  │  State: TanStack Query │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Motia Framework)                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Event-Driven Workflow Steps                     │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐            │   │
│  │  │  Appointment  │  │    Video      │  │    User       │            │   │
│  │  │   Workflows   │  │   Workflows   │  │   Workflows   │            │   │
│  │  └───────┬───────┘  └───────┬───────┘  └───────────────┘            │   │
│  │          │                  │                                        │   │
│  │          ▼                  ▼                                        │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                    Event Bus (BullMQ)                        │    │   │
│  │  │  appointment.created → email notification → analytics        │    │   │
│  │  │  video.uploaded → mux processing → thumbnail generation      │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                          │                              │
                          ▼                              ▼
              ┌───────────────────┐          ┌───────────────────┐
              │     Database      │          │    Mux Video      │
              │   (PostgreSQL)    │          │   Infrastructure  │
              └───────────────────┘          └───────────────────┘
```

### Frontend Stack

| Technology | Why I Chose It |
|------------|----------------|
| **Next.js 15** | Server Components for performance, App Router for clean routing, Turbopack for fast development |
| **TypeScript** | Type safety across the entire codebase prevents runtime errors |
| **Tailwind CSS 4** | Rapid UI development with utility classes and dark mode support |
| **Clerk** | Seamless authentication with minimal setup - handles sign-up, sign-in, and user management |
| **TanStack Query** | Intelligent caching reduces API calls by 40% with 5-minute stale time configuration |
| **Radix UI** | Accessible, unstyled primitives that work perfectly with Tailwind |
| **VAPI** | Powers the AI voice assistant with natural conversation capabilities |

### Backend: Why Motia?

This is where AyurAI's architecture gets interesting. Instead of building a traditional Express/Fastify backend, I chose **Motia** - an event-driven workflow orchestration framework.

#### The Problem with Traditional Backends

Building a wellness platform traditionally would require:
- Manually creating routes for every endpoint
- Writing complex coordination logic (book appointment → send email → track analytics)
- Managing event flows between features
- Handling error recovery and retry logic
- Maintaining separate API documentation

This leads to **tightly coupled spaghetti code** that becomes a maintenance nightmare as the app grows.

#### How Motia Solves This

With Motia, each feature is a **self-contained workflow step**:

```typescript
// Example: Appointment creation step
export const config: ApiRouteConfig = {
  type: 'api',
  name: 'CreateAppointment',
  path: '/api/appointments',
  method: 'POST',
  emits: ['appointment.created'],  // Declares events it produces
  flows: ['appointment-management'],
  middleware: [authMiddleware, rateLimiter, sanitization],
}

export const handler = async (req, ctx) => {
  // Create appointment in database
  const appointment = await prisma.appointment.create({ ... })

  // Emit event - Motia automatically orchestrates downstream actions
  await ctx.emit({
    topic: 'appointment.created',
    data: { appointmentId, patientEmail, doctorName }
  })

  return { status: 201, body: appointment }
}
```

When `appointment.created` is emitted, Motia automatically triggers:
- Email notification to the user
- Email notification to the doctor
- Analytics tracking
- Cache invalidation

**No manual coordination code required.**

#### Motia's Key Advantages

| Feature | Benefit |
|---------|---------|
| **Declarative Steps** | Each workflow is self-documenting with clear inputs, outputs, and events |
| **Event-Driven** | Loose coupling - add features without touching existing code |
| **Built-in Middleware** | Auth, rate limiting, sanitization, error handling out of the box |
| **Visual Debugging** | Motia Workbench shows real-time event flows and logs |
| **Type Safety** | Full TypeScript support with Zod validation |
| **Scalability** | BullMQ handles event queuing for production workloads |

### Database Design

Using Prisma ORM with PostgreSQL:

- **Users** - Synced with Clerk authentication
- **Doctors** - Practitioner profiles with availability
- **Appointments** - Bookings with status tracking (CONFIRMED, COMPLETED, CANCELLED)
- **Videos** - Educational content metadata with Mux integration
- **VideoWatch** - Progress tracking per user per video

---

## Use of Mux 

Mux is the backbone of AyurAI's video library feature. Here's how I integrated it:

### 1. Video Upload Flow

When admins upload educational content, they don't upload to my server - they upload **directly to Mux**:

```typescript
// Step 1: Create a direct upload URL
const upload = await mux.video.uploads.create({
  new_asset_settings: {
    playback_policy: ['public'],
  },
})

// Step 2: Admin uploads directly to Mux via the returned URL
// No video data touches my server - faster, more efficient

// Step 3: Poll for processing completion
const asset = await mux.video.assets.retrieve(assetId)
```

### 2. Automatic Processing

Once uploaded, Mux automatically handles:
- **Encoding** - Converts to multiple quality levels
- **Adaptive Bitrate Streaming** - HLS/DASH for smooth playback on any connection
- **Thumbnail Generation** - `https://image.mux.com/{playbackId}/thumbnail.jpg`
- **Global CDN Delivery** - Fast loading worldwide

### 3. Progress Tracking Integration

I built a custom progress tracking system on top of Mux playback:

```typescript
// VideoPlayer component tracks time position
const handleTimeUpdate = () => {
  setCurrentTime(videoRef.current.currentTime)
}

// Every 15 seconds, save progress to database
await videoApi.updateProgress(videoId, currentTime, duration)

// When user returns, resume from saved position
videoRef.current.currentTime = initialPosition
```

### 4. Playback Implementation

Videos are streamed using Mux's HLS URLs:

```typescript
<video
  src={`https://stream.mux.com/${muxPlaybackId}.m3u8`}
  controls
  className="w-full aspect-video"
/>
```

### My Experience Building with Mux

**What I loved:**
- **Zero encoding headaches** - Just upload and it works
- **Instant thumbnails** - No manual screenshot extraction
- **Developer experience** - The SDK is clean and well-documented
- **Reliability** - Netflix-grade infrastructure means videos just play

**Challenges solved:**
- Initially had image optimization issues with `image.mux.com` - solved by adding it to Next.js `remotePatterns`
- Progress tracking required careful debouncing to avoid API spam during playback

**The Result:**
Users get a seamless video experience - adaptive quality, instant start, resume functionality - without me building any video infrastructure. Mux handles the heavy lifting so I could focus on the wellness platform features.

---

## Project Structure

```
ayurai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── dashboard/          # User dashboard + video library
│   │   ├── admin/              # Admin dashboard
│   │   ├── appointments/       # Booking system
│   │   └── voice/              # AI assistant
│   ├── components/
│   │   ├── ui/                 # Radix + shadcn components
│   │   ├── dashboard/          # Dashboard components
│   │   └── admin/              # Admin components
│   ├── hooks/                  # React Query hooks
│   └── lib/actions/            # Server actions
│
├── backend/
│   ├── src/api/                # Motia workflow steps
│   │   ├── create-appointment.step.ts
│   │   ├── admin-add-video.step.ts
│   │   └── ...
│   └── src/events/             # Event handlers
│
└── prisma/schema.prisma        # Database schema
```

---

## Running Locally

```bash
# Frontend
npm install
npm run dev

# Backend (separate terminal)
cd backend
npm install
npm run dev
```

Required environment variables: `DATABASE_URL`, `CLERK_SECRET_KEY`, `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`

---

## Conclusion

AyurAI demonstrates how modern tools like **Motia** for event-driven backends and **Mux** for video infrastructure enable solo developers to build production-quality applications that would traditionally require entire teams.

The combination allows me to focus on what matters - creating a meaningful wellness platform - while the infrastructure handles the complexity.

---


