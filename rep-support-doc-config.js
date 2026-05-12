/**
 * File: rep-support-doc-config.js
 * Rep Support Doc config — call scripts, talk tracks, and objection bridges
 * selected by diagnosis state and dimension score thresholds.
 * Source of truth: rep-support-doc-config.json (keep in sync).
 */

var REP_SUPPORT_DOC_CONFIG_ = null;

function getRepSupportConfig_() {
  if (!REP_SUPPORT_DOC_CONFIG_) {
    REP_SUPPORT_DOC_CONFIG_ = buildRepSupportDocConfig_();
  }
  return REP_SUPPORT_DOC_CONFIG_;
}

function buildRepSupportDocConfig_() {
  return {

    _vertical_terms: {
      'used_car_dealerships':     { vertical_term: 'dealership',          vertical_term_plural: 'dealerships' },
      'contractors_trades':       { vertical_term: 'contractor',          vertical_term_plural: 'contractors' },
      'roofing':                  { vertical_term: 'roofer',              vertical_term_plural: 'roofers' },
      'exteriors_siding_windows': { vertical_term: 'exterior contractor', vertical_term_plural: 'exterior contractors' },
      'new_used_dealerships':     { vertical_term: 'dealership',          vertical_term_plural: 'dealerships' },
      'daycares_childcare':       { vertical_term: 'childcare center',    vertical_term_plural: 'childcare centers' }
    },

    sections: {

      '00_pre_call_prep': {
        title: 'Before You Share Your Screen',
        instructions: 'Read this 60 seconds before the call. Do not share your screen immediately. Start with a conversation.',
        openers: {
          anchor:    { opener: "I pulled your market data and I'll be honest — you're in a stronger position than most {{vertical_term_plural}} I analyze. But I found something interesting that I think you'll want to see.", mindset: "This person knows they're good. Don't insult them with a problem pitch. Lead with respect, then show them the ceiling they haven't hit yet.", pacing: 'Relaxed. Peer conversation. You\'re showing them an opportunity, not a crisis.' },
          contender: { opener: "I ran your market data against the other {{vertical_term_plural}} in {{city}} and there's a clear picture forming. Some of it's going to feel right — some of it might surprise you. Mind if I share my screen?", mindset: "This person thinks they're doing okay. They are — but they have blind spots. Your job is to show them what they're not seeing without making them defensive.", pacing: "Steady. Confident. Let the data create the tension — don't force it." },
          underdog:  { opener: "I've been looking at the {{vertical_term}} market in {{city}} and I pulled your data specifically because your operation caught my attention. But there's a disconnect between what you're doing and what the market is showing — I want to walk you through it.", mindset: "This person is working hard but losing ground. They probably feel it but don't know why. Your job is to name the problem clearly.", pacing: "Direct but empathetic. They need to hear the truth but they also need to feel like you understand their situation." },
          outgunned: { opener: "I'll be straight with you — I pulled your market data and the numbers tell a story that doesn't match the business you're running. I think you deserve to see what's actually happening in your market. Can I share my screen?", mindset: "This person is getting outperformed and may not fully realize it. Be honest. Don't sugarcoat. But also don't pile on — show the path out.", pacing: "Serious. No small talk. Get to the Mirror quickly." },
          ghost:     { opener: "I'm going to show you something that might be uncomfortable — but I think it's important. I pulled the market data for {{vertical_term_plural}} in {{city}} and your business is effectively invisible in the places where customers are actually searching. I want to show you exactly what I mean.", mindset: "This person has no idea how invisible they are. The Mirror is going to be a wake-up call. Let it land. Don't rush past the discomfort.", pacing: "Slow. Deliberate. Pause after every major point. Let them process." }
        },
        universal_rules: [
          "Never open with pricing or product features.",
          "Never say 'SEO', 'keywords', 'backlinks', or 'optimize' at any point in the call.",
          "Use their business name, their city, their actual numbers. Never generic.",
          "The first 90 seconds set the tone for the entire call. If you rush, you lose."
        ]
      },

      '01_hero_mcs_reveal': {
        title: 'Market Capture Score Reveal',
        mirror_section: 'Hero — MCS number + diagnosis badge + dimension bars',
        instructions: 'This is the first thing they see. Let it land.',
        talk_tracks: {
          anchor:    { script: "So your Market Capture Score is {{market_capture_score}} out of 100. That puts you in the Anchor category — meaning the market reads you as a strong player in {{city}}. But here's the thing — being an Anchor today doesn't mean you'll be one in six months. Let me show you where the pressure is building.", pause_point: "After 'six months.' Let them sit with the idea that their position isn't permanent.", anticipated_reaction: "They'll feel good about the score. That's fine. Use that confidence to make the gaps more surprising when you get to them." },
          contender: { script: "Your Market Capture Score is {{market_capture_score}} out of 100. That's Contender territory — you're competitive, you're in the fight, but you're not controlling your market. Let me show you exactly where the gaps are.", pause_point: "After 'controlling your market.' That word — controlling — is important. They want to control. They know they're not.", anticipated_reaction: "They'll nod. They feel this already. Now you're putting a number on it." },
          underdog:  { script: "Your Market Capture Score is {{market_capture_score}}. That's Underdog territory — meaning the market sees you, but it's not choosing you. And the reason isn't your work — it's what the market can actually read about your work.", pause_point: "After 'read about your work.' This reframes the problem from their skills to their visibility. That's a crucial shift.", anticipated_reaction: "Defensive or quiet. Both are fine. Let them process." },
          outgunned: { script: "Your Market Capture Score is {{market_capture_score}}. I'm going to be direct — that's Outgunned territory. It means competitors in your market are projecting more trust, more presence, and more credibility than your business — even if the reality is the opposite. Let me show you why.", pause_point: "After 'the opposite.' That's the hook — their business is real but the market doesn't know it.", anticipated_reaction: "Surprise or frustration. Good. Channel it toward the solution, not away from it." },
          ghost:     { script: "Your Market Capture Score is {{market_capture_score}}. That's what we call Ghost territory — and I know that sounds harsh, but here's what it means: when a customer in {{city}} searches for a {{vertical_term}}, the market is not showing them your business. You are effectively invisible in the search that matters most. Let me show you exactly why.", pause_point: "After 'invisible.' Long pause. This is the most important moment in the call. Do not fill the silence.", anticipated_reaction: "Shock, disbelief, or 'that can't be right.' All normal. Say: 'Let me walk you through the data — it'll make sense in a minute.'" }
        },
        dimension_transition: "Now let me show you what's behind that score. There are five dimensions the market uses to read your business — and each one is either working for you or against you right now."
      },

      '02_what_they_cannot_control': {
        title: 'What They Cannot Control',
        mirror_section: 'Cards 1 (Discovery), 2 (Trust Surface), 5 (Competitive)',
        instructions: "These three cards cover forces outside their control. Walk through them with factual tone. No softening. Let the data do the damage.",
        lead_in: "Let's start with the parts of this you don't control — because I think it's important you understand what's happening in your market before we talk about what you can do about it.",
        discovery: {
          script: "Your Maps position right now is {{maps_position}}. You didn't choose that. The platform did. And here's the reality — {{discovery_insight}}",
          insights: {
            high: "you're showing up, but the algorithm rearranges this constantly. The position you have today is not guaranteed tomorrow.",
            mid:  "the customers who needed a {{vertical_term}} in {{city}} last week — most of them never scrolled far enough to see your name.",
            low:  "you do not exist in this search. The customers who need you are making decisions right now, and your business is not part of that decision."
          },
          pause_point: "After the insight. Let them feel the weight of not controlling their own visibility."
        },
        trust: {
          script: "Now look at this — you have {{review_count}} reviews at {{rating}} stars. The {{vertical_term}} buyers are comparing you to has {{peer_avg_reviews}} reviews at {{peer_avg_rating}} stars. {{trust_insight}}",
          insights: {
            high: "Your numbers are solid — but solid is relative. The gap between you and the leader is narrower than it looks, and it's closing.",
            mid:  "When a customer compares those two numbers side by side — and they do — which one do they call first? You already know the answer.",
            low:  "You are asking someone to trust you based on almost nothing visible. The customer doesn't know your work. They know this number."
          },
          pause_point: "After the comparison. Point at the actual numbers on screen. Let them see the gap."
        },
        competitive: {
          script: "And here's the competitive picture — there are {{similar_places_count}} {{vertical_term_plural}} in your market. {{competitor_1_name}} is currently more visible than you. Not because they're better — because the market sees them more clearly. {{competitive_insight}}",
          insights: {
            high: "You're in the fight. But every month they add activity and you don't, the cost for you to close that gap increases.",
            mid:  "The customer who should have been yours went to them. Not because of quality. Because of visibility.",
            low:  "Every week you hold still, they take more ground. And that ground doesn't come back on its own."
          },
          pause_point: "After the last line. This is where they start to feel the urgency. Don't move on too quickly."
        },
        transition: "So that's what you're up against — forces you don't control. Now let me show you what the data says about the things you do control."
      },

      '03_what_they_are_not_doing': {
        title: 'What They Are Not Doing',
        mirror_section: 'Cards 3 (Engagement) and 4 (Profile Authority)',
        instructions: "This is the stern section. Point at their actual numbers. No fluff. The tone is: this is what the data says and you cannot argue with it.",
        lead_in: "Now here's where it gets honest. These are things you control — and the numbers tell me you're leaving them on the table.",
        engagement: {
          script: "Your owner response rate is {{owner_response_rate}}. Your last response was {{latest_response_date}}. {{engagement_insight}}",
          insights: {
            high: "You respond — and that puts you ahead of most. But 'ahead of most' is a low bar. The question is whether you respond to every single one. Because the customer reading your reviews right now is counting.",
            mid:  "Customers are leaving reviews about their experience with your business. And you're leaving silence. That silence is your answer — and every potential customer reads it that way.",
            low:  "I need to be direct here — you have a public storefront that you are choosing to ignore. Every unanswered review tells the next customer that nobody is running this business."
          },
          delivery_note: "Point at the response rate number on screen. Point at the date. Let the numbers do the talking. Don't editorialize — the data is damning enough.",
          pause_point: "After the insight. If they get defensive, say: 'I'm not judging — I'm showing you what the customer sees. And this is what they see.'"
        },
        profile: {
          script: "Now look at your profile — {{photo_count}} photos, {{owner_photos}} from you. Service options listed: {{service_options_summary}}. {{profile_insight}}",
          insights: {
            high: "Your profile is functional. But functional doesn't win — complete does. And there are gaps here that the platform penalizes you for.",
            mid:  "You have a listing. The {{vertical_term}} winning your market has a presence. There's a difference. And the customer can feel it even if they can't articulate why.",
            low:  "Your profile is actively working against you. Missing services, missing photos, missing information — each one is the platform choosing someone else for a job you could have done."
          },
          delivery_note: "If photos from owner is low: 'You are letting strangers curate your first impression. Google scraped these. Customers uploaded these. None of them are showing what you want to show.'",
          pause_point: "After the profile insight. This is where they usually say 'I didn't know that mattered.' That's your opening."
        },
        transition: "Look — I'm not showing you this to make you feel bad. I'm showing you this because these are things you can fix. And when you fix them, the market reads your business differently. Which brings me to the last part."
      },

      '04_what_they_should_be_doing': {
        title: 'What They Should Be Doing',
        mirror_section: 'Card 6 (NeoLocal Path) + Dimension Scores + Comparison Box',
        instructions: "This is the uncomfortable push. The tone is: why are you even open if you're not doing the minimum? Deliver it as an operator talking to another operator — not a lecture.",
        lead_ins: {
          anchor:    "You're in a strong position. But you're not doing anything to protect it. What happens when the competitor behind you starts doing everything you're not?",
          contender: "You're competitive. But competitive is not the same as dominant. And the gap between where you are and where you could be — it's not talent, it's not work ethic. It's what you're doing with the proof.",
          underdog:  "You're doing real work every day. But the market doesn't know it. And every day that gap between your real operation and your visible presence stays open, someone else fills it.",
          outgunned: "Your operation is real. Your work is real. But right now you're letting that work disappear the moment it's done. Why?",
          ghost:     "I need to ask you something directly — you built this business. You show up every day. You do the work. So why does the market not know you exist?"
        },
        dimension_walk: {
          script: "Look at these five scores. {{weakest_dimension_label}} is at {{weakest_dimension_score}}. That's where the most opportunity is — and that's where the market is punishing you hardest right now. Every point you gain there translates directly into more customers seeing your business.",
          delivery_note: "Point at the weakest dimension on screen. This is the most concrete moment in the call — one number, one dimension, one clear opportunity."
        },
        comparison_box: {
          script: "Now I want to show you the two paths. On the left is what most {{vertical_term_plural}} do — and I'm guessing some of this looks familiar. On the right is what happens when your actual work becomes the marketing.",
          delivery_note: "Read the trad points slowly. Let them nod at each one. They've lived this. Then read the NeoLocal points — faster, more energy. The contrast should feel like relief.",
          pause_point: "After the last NeoLocal point. Let the comparison sit. Don't explain it — they get it."
        },
        transition: "So that's the picture. The market is reading your business right now based on what it can see — and right now, it's not seeing enough. The question is what you want to do about it."
      },

      '05_the_close': {
        title: 'The Close',
        mirror_section: 'Footer band',
        instructions: "Do not hard close. This is a natural transition from the Mirror to next steps. The Mirror did the selling — you're just opening the door.",
        footer_read: {
          script: "I'll leave you with this — {{footer_statement}}",
          delivery_note: "Read the footer statement directly from the Mirror. It's written to close. Let it do its job."
        },
        founding_member: {
          note: "Only if Founding 25 spots remain. If sold out, skip to standard close.",
          script: "Here's why I'm bringing this to you now specifically. We're onboarding our first 25 clients — founding members — and the terms are different than anything we'll offer after. The rate locks permanently, you get 90 days of white-glove onboarding, a dedicated strategist for the life of the contract, and first access to everything we build. Once those 25 spots are filled, they're gone.",
          delivery_note: "State it once. Do not repeat. Do not pressure. Scarcity is real — let it be real.",
          pause_point: "After 'they're gone.' Wait for them to ask the next question."
        },
        standard_close: {
          script: "What I'd suggest is this — let me send you this Market Mirror so you can look at it on your own time. And if what you're seeing here matches what you're feeling in your business, let's set up a follow-up where I can show you exactly what the first 90 days would look like.",
          delivery_note: "Low pressure. The Mirror is the closer — not you. Send it immediately after the call."
        },
        if_yes: {
          script: "Great. Here's what happens next — I'll send you the founding member terms today. It's straightforward: annual contract, first three months prepaid, then your next payment isn't until month six. I'll also introduce you to your strategist within 48 hours so we can start mapping your market.",
          delivery_note: "Be specific. Confidence here signals operational discipline. They just saw the Mirror — now show them the operation behind it matches."
        },
        if_not_yet: {
          script: "Completely understand. I'll send you the Mirror and let you sit with it. But I'll be honest — the founding member terms won't be available indefinitely, and the earlier you start, the more your advantage compounds. When would be a good time to reconnect?",
          delivery_note: "Get a date. Don't leave with 'I'll think about it' and no next step. A date is a commitment. 'I'll think about it' is a polite no."
        },
        objections: [
          { trigger: 'Too Expensive', bridge: "I understand. Let me ask you this — what are you spending right now on things that don't compound? Google Ads, agencies, social posting? The difference here is that every month you're with us, the value increases. That's not how any other marketing spend works." },
          { trigger: 'Need to Think', bridge: "Of course. What specifically do you want to think about? I ask because if there's a question I can answer right now, I'd rather you have the full picture." },
          { trigger: 'What Guarantees', bridge: "I won't guarantee you a specific ranking — anyone who does is lying to you. What I can guarantee is that every signal we build is real, verified, and permanent. The question isn't whether it works — it's whether you start building now or let your competitors build further ahead." },
          { trigger: 'Already Have an Agency', bridge: "That's fine — and I'd actually suggest keeping them for now. What we do is different. We're not optimizing your website or writing blog posts. We're turning your actual completed work into signals that search engines and AI platforms trust. It's a different layer entirely." },
          { trigger: 'Show Me Results First', bridge: "I respect that. Here's the reality — we're at the founding stage, which is exactly why the terms are what they are. The rate you'd get today locks permanently. When we have 25 clients with six months of data, that question answers itself — and your rate is locked regardless." }
        ]
      },

      '06_post_call': {
        title: 'After The Call',
        instructions: 'Immediately after hanging up. Do these in order.',
        steps: [
          "Send the Market Mirror link within 5 minutes. No delay. The urgency is real while the call is fresh.",
          "Log the call outcome in the CRM — update lead stage, add notes on which sections resonated, which objections came up.",
          "If they said yes: send founding member terms within 2 hours. Introduce strategist within 48 hours.",
          "If they said 'not yet': set follow-up task for the date they gave you. Do not follow up before that date unless they reach out first.",
          "If they pushed back hard: wait 72 hours, then send one follow-up message referencing a different dimension than the one you led with on the call. Different angle, same data."
        ]
      }

    }
  };
}
