/**
 * File: 14_market_mirror_profiles.js
 * NeoLocal Market Mirror — vertical profiles / language rules
 */
var MM = typeof MM !== "undefined" ? MM : {};

function getMarketMirrorVerticalProfile_(vertical) {
  var profiles = {
    auto_retail: {
      key: "auto_retail",
      label: "Used Car Dealership",
      focus: "trust + inventory + buyer confidence",
      banned_phrases: [
        "you just need more reviews",
        "SEO hack",
        "ranking trick",
        "we will make you #1",
        "jobs completed"
      ],
      metric_labels: {
        trust_gap: "Trust Gap",
        presence_completeness: "Presence Completeness",
        proof_of_work_signal: "Visible Proof Signal",
        market_weight: "Market Weight",
        buyer_confidence: "Buyer Confidence",
        visibility_pressure: "Visibility Pressure",
        acceleration_potential: "Acceleration Potential"
      },
      rep_prompt_groups: {
        market: [
          "When buyers compare dealers in your area, what do you think they notice first?",
          "Do you think the best dealer always wins, or the dealer that feels safest fastest?"
        ],
        mirror: [
          "Do you feel your online presence reflects the strength of your lot?",
          "If a buyer compares you to 3 nearby options, do you look like the obvious choice?"
        ],
        cost: [
          "How many buyers do you think never even call because another store feels easier to trust first?",
          "Do you feel you are sometimes forced to win on price instead of position?"
        ],
        close: [
          "If your actual dealership activity started strengthening your visibility, would that change how you compete?"
        ]
      },
      traditional_effort: [
        "consistent profile upkeep",
        "inventory merchandising discipline",
        "review follow-up",
        "posting / media updates",
        "website / lot presentation maintenance",
        "sales + ops coordination",
        "agency or internal marketing support"
      ]
    },

    hvac: {
      key: "hvac",
      label: "HVAC",
      focus: "service legitimacy + urgency + operational trust",
      banned_phrases: [
        "just get more reviews",
        "lead gen trick",
        "SEO hack",
        "rank instantly",
        "blog more"
      ],
      metric_labels: {
        trust_gap: "Trust Gap",
        presence_completeness: "Readiness Completeness",
        proof_of_work_signal: "Service Proof Signal",
        market_weight: "Operational Weight",
        buyer_confidence: "First-Call Confidence",
        visibility_pressure: "Visibility Pressure",
        acceleration_potential: "Acceleration Potential"
      },
      rep_prompt_groups: {
        market: [
          "When someone's system fails, do they research deeply or pick who feels most credible fastest?",
          "Do you think the most capable HVAC company always gets the first call?"
        ],
        mirror: [
          "Does your online presence reflect the size and seriousness of your operation?",
          "If someone compares 3 HVAC companies, do you look like the safe choice?"
        ],
        cost: [
          "How many urgent calls do you think go elsewhere before you're even considered?",
          "Are you often competing too late, after someone else already earned the first trust?"
        ],
        close: [
          "If your real service activity started compounding into stronger local trust, what would that change?"
        ]
      },
      traditional_effort: [
        "ongoing GBP management",
        "review follow-up",
        "service + financing clarity",
        "photo uploads",
        "posting and updates",
        "website / listing consistency",
        "owner or office manager coordination",
        "agency or SEO support"
      ]
    },

    roofing: {
      key: "roofing",
      label: "Roofing",
      focus: "risk + visual proof + shortlist confidence",
      banned_phrases: [
        "just get reviews",
        "storm ranking trick",
        "cheap leads",
        "SEO hack",
        "you just need content"
      ],
      metric_labels: {
        trust_gap: "Trust Gap",
        presence_completeness: "Presence Completeness",
        proof_of_work_signal: "Project Proof Signal",
        market_weight: "Market Weight",
        buyer_confidence: "Shortlist Confidence",
        visibility_pressure: "Visibility Pressure",
        acceleration_potential: "Acceleration Potential"
      },
      rep_prompt_groups: {
        market: [
          "Do buyers choose roofers on price alone, or the company that feels safest and most proven?",
          "Do you think visible proof influences who gets shortlisted first?"
        ],
        mirror: [
          "Does your online presence reflect the seriousness of your company?",
          "If someone compares a few roofers quickly, do you look like the safe bet?"
        ],
        cost: [
          "How many estimate opportunities do you think never reach you because another company looks more established first?",
          "Do you feel you sometimes have to sell harder than you should?"
        ],
        close: [
          "If every completed project started making your company more visible and trusted, what would that change?"
        ]
      },
      traditional_effort: [
        "steady profile management",
        "before / after media follow-up",
        "review collection",
        "estimate messaging upkeep",
        "posting and seasonal updates",
        "neighborhood / service content",
        "field-team proof collection",
        "agency or internal marketing support"
      ]
    },

    local_service: {
      key: "local_service",
      label: "Local Service",
      focus: "local trust + visible legitimacy",
      banned_phrases: [],
      metric_labels: {
        trust_gap: "Trust Gap",
        presence_completeness: "Presence Completeness",
        proof_of_work_signal: "Proof Signal",
        market_weight: "Market Weight",
        buyer_confidence: "Buyer Confidence",
        visibility_pressure: "Visibility Pressure",
        acceleration_potential: "Acceleration Potential"
      },
      rep_prompt_groups: {
        market: ["How quickly do buyers form trust in your category?"],
        mirror: ["Does your online presence reflect the strength of your operation?"],
        cost: ["How many opportunities never become calls?"],
        close: ["If your real activity strengthened visibility, what would that change?"]
      },
      traditional_effort: [
        "profile upkeep",
        "proof collection",
        "content / posting",
        "reviews",
        "manual coordination"
      ]
    }
  };

  return profiles[vertical] || profiles.local_service;
}
