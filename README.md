# StadiumIQ (Midfield AI) - PromptWars Virtual Submission

## Challenge 4: Smart Stadiums & Tournament Operations
StadiumIQ is a next-generation fan experience and stadium operations platform designed for large-scale sporting events like the FIFA World Cup.

### Persona & Approach
**Persona:** Stadium Operations Manager & Diverse Fan Demographics
**Approach & Logic:** 
This application bridges the gap between complex stadium logistics and individual fan experiences. 
- **The Operations Logic:** By integrating AI-driven insights (CrowdOps) and real-time mapping, stadium staff can dynamically allocate resources, control gate flow, and monitor high-risk zones.
- **The Fan Logic:** Fans receive personalized contextual dashboards based on their ticket status (e.g., standard vs. VIP). 
- **Inclusivity First:** We assume that a truly "smart" stadium must serve everyone. The app logic includes dynamic UI stripping (Sensory Calm Mode) and live text-to-speech pipelines to accommodate neurodivergent and visually impaired users.

### Assumptions Made
1. The app assumes the existence of IoT sensors at gates to feed data into the CrowdOps module.
2. We assume users have stable internet connections for real-time Firebase syncing, though caching is partially implemented for critical FAQ interactions.
3. The AI travel agent and operational briefing rely on prompt-engineered Gemini instances to synthesize real-time rules.

## Features
- **Role-Based Access Control**: Different views for Fans, Staff, Volunteers, and Admins.
- **Ticketing & Real-time Transfers**: Mock purchase tickets and securely transfer them to other fans using Firestore synchronization.
- **Global Match Context**: Hold multiple tickets and switch between them instantly. VIP tickets automatically trigger a premium "Royal Gold" UI theme.
- **Advanced Accessibility Suite**:
  - Live ASL (Sign Language) Interpreter Overlay 
  - Audio Commentary (Text-to-Speech)
  - Neurodivergent Sensory Calm Mode
  - Real-time Language Translation (English, Spanish, French)
- **Smart Routing**: Live Google Maps ETA integration with wheelchair-accessible routing options.
- **AI Integration**: Powered by Gemini API for FanAssist chatbot and CrowdOps analytics.

## Tech Stack
- React & Vite
- Tailwind CSS & Framer Motion
- Firebase (Auth, Firestore, Hosting, Cloud Functions)
- Google Maps API
- Google Gen AI (Gemini / Vertex)

## Getting Started Locally
1. Clone the repository
2. Run `pnpm install`
3. Add your `.env` configuration
4. Run `pnpm run dev`
