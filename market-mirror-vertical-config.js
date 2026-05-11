/**
 * File: market-mirror-vertical-config.js
 * Vertical copy config for the NeoLocal Market Mirror V3 generator.
 * Source of truth: market-mirror-vertical-config.json (keep in sync).
 *
 * Cards use score-tier titles: >= 70 = high, >= 40 = mid, < 40 = low.
 * Bullet templates use {{token}} syntax — filled from lead enrichment data.
 */

var MARKET_MIRROR_VERTICAL_CONFIG_ = null;

function getMarketMirrorConfig_() {
  if (!MARKET_MIRROR_VERTICAL_CONFIG_) {
    MARKET_MIRROR_VERTICAL_CONFIG_ = buildVerticalConfig_();
  }
  return MARKET_MIRROR_VERTICAL_CONFIG_;
}

function buildVerticalConfig_() {
  return {

    verticals: {

      "used_car_dealerships": {
        "vertical_label": "Used Car Dealership Edition",
        "hero_headline_line1": "YOU'RE MOVING UNITS.",
        "hero_headline_line2": "THE MARKET DOESN'T KNOW IT.",
        "hero_copy": "Every car you sell is proof your operation works. But the buyer who never called you, never walked your lot, never even saw your name — that buyer made a decision based on what the market showed them. And right now, the market is not showing them you.",

        "cards": {
          "discovery": {
            "card_label": "What You Cannot Control",
            "titles": {
              "high": "Buyers are seeing you — but the algorithm decides the order, not you.",
              "mid": "The buyer who bought from your competitor last week never saw your name.",
              "low": "You do not exist in the search that matters most."
            },
            "bullet_templates": [
              "Maps position: {{maps_position}} in your primary search. You did not choose that. The platform did.",
              "The top 3 results absorb 70–80% of buyer attention. Everyone else splits what's left.",
              "AI search is already recommending dealerships. Yours is not in that conversation."
            ]
          },
          "trust": {
            "card_label": "What Buyers Decide Before Calling",
            "titles": {
              "high": "Your reviews carry weight. But weight is relative.",
              "mid": "A buyer comparing you to the dealer down the road sees a gap — and they trust the gap.",
              "low": "You are asking buyers to take a risk your competitors are not asking them to take."
            },
            "bullet_templates": [
              "{{review_count}} reviews at {{rating}}★. The dealer buyers compare you to has {{peer_avg_reviews}} at {{peer_avg_rating}}★.",
              "Rating trend: {{rating_trend}}. This is public. Every buyer sees it before they call.",
              "Customers talk about: {{review_topics_summary}}. This is your reputation — written by other people."
            ]
          },
          "engagement": {
            "card_label": "The Minimum You Are Not Doing",
            "titles": {
              "high": "You respond. That puts you ahead of most. But most is a low bar.",
              "mid": "Buyers leave reviews. You leave silence. That silence is your answer.",
              "low": "You have a public storefront you are choosing to ignore."
            },
            "bullet_templates": [
              "Owner response rate: {{owner_response_rate}}. Every unanswered review tells the next buyer you do not care.",
              "Last response: {{latest_response_date}}. If that date is old, the market reads it as abandonment.",
              "Responding to reviews is not customer service. It is the most visible proof that someone is running this business."
            ]
          },
          "profile": {
            "card_label": "Your Storefront Is Half Built",
            "titles": {
              "high": "Your profile is functional. Functional does not win.",
              "mid": "You have a listing. You do not have a presence.",
              "low": "Your profile is telling buyers to go somewhere else."
            },
            "bullet_templates": [
              "{{photo_count}} photos. {{owner_photos}} from you. The rest are from customers and Google. You are letting strangers curate your first impression.",
              "Service options listed: {{service_options_summary}}. If this is incomplete, the platform assumes you do not offer it.",
              "A missing category, an empty service list, no posted hours — each one is a reason for the algorithm to rank someone else higher."
            ]
          },
          "competitive": {
            "card_label": "What Your Competitors Are Doing",
            "titles": {
              "high": "You are in the fight. But the fight is getting harder every month.",
              "mid": "While you held still, the market moved.",
              "low": "Your competitors are not better. They are just more visible. And visible wins."
            },
            "bullet_templates": [
              "{{similar_places_count}} dealerships competing for the same buyer in your market.",
              "{{competitor_1_name}} is currently positioned above you. That is not because they sell better cars.",
              "Every month a competitor adds reviews, photos, and activity, the cost for you to close that gap increases."
            ]
          },
          "neolocal_path": {
            "card_label": "What You Control Starting Now",
            "card_title": "Stop letting the visible layer lie about your dealership.",
            "bullet_templates": [
              "Every unit you move can become proof the market reads. Right now it disappears.",
              "Your operation is real. Your online presence should carry the same weight as your lot.",
              "This compounds. Six months of verified activity creates a position no competitor can copy without doing the same work."
            ]
          }
        },

        "dimension_section_sub": "Five surfaces the market uses to read your dealership. You control some. You do not control others. But every one of them is deciding who gets the next buyer.",

        "comparison": {
          "sub": "This is not about marketing. This is about whether the market reads your operation accurately — or whether it keeps rewarding competitors who are simply more visible.",
          "trad": [
            "Hire an agency. Wait for blog posts to matter. They won't.",
            "Ask your team to post on social. Watch it die after week two.",
            "Chase reviews manually. Get five. Your competitor got twelve.",
            "Pay for ads to compensate for a profile that doesn't convert.",
            "Spend internally on things that don't compound.",
            "Repeat every quarter. Wonder why nothing sticks."
          ],
          "neo": [
            "Every sale becomes a verified signal the market can read.",
            "Your operation is the content. No one needs to write anything.",
            "The proof compounds automatically — six months in, the gap is permanent.",
            "Discovery across Google, Maps, and AI search. Not just one channel.",
            "Built for operators who run real businesses, not marketing departments.",
            "The longer you operate, the harder you are to outrank."
          ]
        },

        "footer_statement": "Your dealership is real. Your reputation is earned. But right now, the market cannot see either of those things clearly — and every day it stays that way, the buyer who should have been yours goes somewhere else."
      },


      "contractors_trades": {
        "vertical_label": "Contractors & Trades Edition",
        "hero_headline_line1": "YOU'RE ON THE JOB EVERY DAY.",
        "hero_headline_line2": "THE MARKET HAS NO IDEA.",
        "hero_copy": "Every foundation you pour, every panel you wire, every call you answer at 6 AM — that is proof your operation is real. But the homeowner who hired someone else last Tuesday never found you. Not because you weren't good enough. Because the market never showed them you existed.",

        "cards": {
          "discovery": {
            "card_label": "What You Cannot Control",
            "titles": {
              "high": "You show up — but the homeowner already called the first three names they saw.",
              "mid": "The homeowner who needed you yesterday hired someone they found in 30 seconds. It wasn't you.",
              "low": "You are doing the work. The market is giving the credit to someone else."
            },
            "bullet_templates": [
              "Maps position: {{maps_position}}. The homeowner panicking about a flooded basement is not scrolling to result 8.",
              "The first three contractors they see get the call. Everyone else gets compared on price — if they get compared at all.",
              "AI assistants are already recommending contractors. Your name is not coming up."
            ]
          },
          "trust": {
            "card_label": "What Homeowners Decide Before Calling",
            "titles": {
              "high": "Your reviews are solid. But the contractor they called first had more.",
              "mid": "A homeowner choosing between you and the guy with twice your reviews picks the safe bet.",
              "low": "You are asking someone to let you into their home based on almost nothing."
            },
            "bullet_templates": [
              "{{review_count}} reviews at {{rating}}★. The contractor homeowners compare you to has {{peer_avg_reviews}} at {{peer_avg_rating}}★.",
              "Rating trend: {{rating_trend}}. Homeowners check this. It's the first thing they look at after your name.",
              "Homeowners mention: {{review_topics_summary}}. This is what people say about you when you're not in the room."
            ]
          },
          "engagement": {
            "card_label": "The Minimum You Are Not Doing",
            "titles": {
              "high": "You respond to reviews. That is not a virtue. That is baseline.",
              "mid": "A homeowner left you a review. You left them nothing. They noticed.",
              "low": "Every ignored review is a sign on your door that says 'we don't care.'"
            },
            "bullet_templates": [
              "Owner response rate: {{owner_response_rate}}. The homeowner reading your reviews right now is counting how many you answered.",
              "Last response: {{latest_response_date}}. If that was months ago, the market reads your business as dormant.",
              "A 30-second reply is the cheapest trust signal in your business. You are choosing not to use it."
            ]
          },
          "profile": {
            "card_label": "Your Shopfront Is Half Built",
            "titles": {
              "high": "Your profile is decent. Decent loses to complete.",
              "mid": "You have a listing. The contractor who wins has a presence.",
              "low": "Your Google profile is actively turning away homeowners."
            },
            "bullet_templates": [
              "{{photo_count}} photos. {{owner_photos}} from you. A homeowner wants to see your work. They are seeing whatever Google scraped instead.",
              "Service options: {{service_options_summary}}. If it's not listed, the platform assumes you don't do it. The homeowner moves on.",
              "Missing services, missing hours, missing photos — each one is the platform choosing someone else for a job you could have done."
            ]
          },
          "competitive": {
            "card_label": "What Your Competitors Are Doing",
            "titles": {
              "high": "You're competitive. But the gap is closing from behind.",
              "mid": "The contractor getting your jobs isn't better. They're just easier to find.",
              "low": "Every week you hold still, the cost to catch up gets higher."
            },
            "bullet_templates": [
              "{{similar_places_count}} contractors competing for the same homeowner in your area.",
              "{{competitor_1_name}} is currently more visible. Not more skilled. More visible.",
              "Every review, every photo, every response they add makes your climb steeper."
            ]
          },
          "neolocal_path": {
            "card_label": "What You Control Starting Now",
            "card_title": "Your jobs are the proof. Stop letting them disappear.",
            "bullet_templates": [
              "Every job you complete can become a verified signal the market reads. Right now it vanishes when you leave the site.",
              "Your reputation is in your truck, your tools, your callbacks. Your online presence should carry the same weight.",
              "Six months of verified job activity builds a footprint no competitor can replicate without doing the same work."
            ]
          }
        },

        "dimension_section_sub": "Five surfaces the market uses to decide which contractor gets the call. You control some. You do not control others. But all of them are working right now.",

        "comparison": {
          "sub": "This is not about marketing. This is about whether the homeowner who needs you tomorrow can actually find you — or whether they find the contractor who just happens to be more visible.",
          "trad": [
            "Pay an agency. Get a blog about '5 tips for choosing a contractor.' No one reads it.",
            "Ask your guys to take job site photos. Compliance drops to zero by month two.",
            "Chase reviews after every job. Get a few. Your competitor gets them automatically.",
            "Run Google Ads to compensate for a profile that doesn't convert.",
            "Spend money on things that reset every month.",
            "Repeat. Wonder why the phone still rings for the other guy."
          ],
          "neo": [
            "Every completed job becomes a verified signal tied to real work and real location.",
            "Your crew is already on site. The proof captures itself.",
            "Reviews, photos, and activity compound — six months in, the advantage is permanent.",
            "Discoverable across Google, Maps, and AI search. Not just one ad channel.",
            "Built for contractors who run real operations, not marketing campaigns.",
            "The more jobs you complete, the harder you are to outrank."
          ]
        },

        "footer_statement": "You built this business with your hands. The market should reflect that — and right now, it doesn't. Every day it stays invisible, the homeowner who should have called you calls someone else."
      },


      "roofing": {
        "vertical_label": "Roofing Edition",
        "hero_headline_line1": "YOU PUT ROOFS OVER PEOPLE'S HEADS.",
        "hero_headline_line2": "THE MARKET CAN'T SEE YOU FROM THE GROUND.",
        "hero_copy": "A homeowner with a leak doesn't shop around for weeks. They search, they see three names, they call. The decision happens in seconds — and right now, the market is making that decision without you in the conversation.",

        "cards": {
          "discovery": {
            "card_label": "What You Cannot Control",
            "titles": {
              "high": "You're showing up. But in roofing, showing up second is losing.",
              "mid": "The homeowner with the leak called someone else. They never saw your name.",
              "low": "You are invisible in the most urgent search in home services."
            },
            "bullet_templates": [
              "Maps position: {{maps_position}}. A homeowner with water coming through the ceiling is not scrolling.",
              "Roofing is a panic search. The first name that looks credible gets the call. Period.",
              "Storm chasers and franchise operations are investing in visibility. You're investing in craftsmanship. Only one of those shows up in search."
            ]
          },
          "trust": {
            "card_label": "What Homeowners Decide In 10 Seconds",
            "titles": {
              "high": "Your reputation is strong. But the homeowner doesn't know that — they know your review count.",
              "mid": "The roofer they picked had more reviews. That was the entire decision.",
              "low": "You are asking someone to hand you a $15,000 job based on almost no visible proof."
            },
            "bullet_templates": [
              "{{review_count}} reviews at {{rating}}★. The roofer they're comparing you to: {{peer_avg_reviews}} at {{peer_avg_rating}}★.",
              "Rating trend: {{rating_trend}}. In roofing, a declining trend is a death sentence — this is a trust-first purchase.",
              "Homeowners mention: {{review_topics_summary}}. This is your sales pitch. You didn't write it."
            ]
          },
          "engagement": {
            "card_label": "The Minimum You Are Not Doing",
            "titles": {
              "high": "You respond. Good. Now do it every single time.",
              "mid": "Someone trusted you with their roof. You couldn't be bothered to acknowledge it.",
              "low": "Your review section is a graveyard. Every homeowner who reads it walks away."
            },
            "bullet_templates": [
              "Response rate: {{owner_response_rate}}. In a $10K–$25K decision, the homeowner is reading every single reply — and every silence.",
              "Last response: {{latest_response_date}}. If that's stale, the homeowner assumes the business is too.",
              "A responded review is a second sales conversation. You are choosing to skip it."
            ]
          },
          "profile": {
            "card_label": "Your Storefront Is Doing Damage",
            "titles": {
              "high": "Your profile works. But it's not selling — it's just existing.",
              "mid": "You have a listing. The roofer winning your market has a showroom.",
              "low": "Your profile is the reason homeowners don't call."
            },
            "bullet_templates": [
              "{{photo_count}} photos. {{owner_photos}} from you. Where are the before/afters? Where is the proof you do the work you say you do?",
              "Service options: {{service_options_summary}}. If 'roof repair' isn't listed, the platform won't show you for it. That simple.",
              "An incomplete profile in roofing is a handshake with no eye contact. It reads as untrustworthy."
            ]
          },
          "competitive": {
            "card_label": "What Your Competitors Are Doing",
            "titles": {
              "high": "You're competitive. Storm season will test that.",
              "mid": "The roofer taking your jobs is not better on the roof. They're better on the screen.",
              "low": "Your market is being won by companies that invest in being visible. You're investing in being invisible."
            },
            "bullet_templates": [
              "{{similar_places_count}} roofing companies fighting for the same homeowner.",
              "{{competitor_1_name}} is above you. Not because they install better. Because the market sees them first.",
              "Roofing is a land grab. Every month you don't build presence, they lock in another neighborhood."
            ]
          },
          "neolocal_path": {
            "card_label": "What You Control Starting Now",
            "card_title": "Every roof you install is proof. Stop letting it evaporate.",
            "bullet_templates": [
              "Every completed job — emergency repair, full replacement, inspection — can become a verified market signal. Right now it disappears when you leave the driveway.",
              "Your work speaks for itself on the roof. It needs to speak for itself online.",
              "In roofing, six months of verified activity in a market is a moat. Twelve months is a wall."
            ]
          }
        },

        "dimension_section_sub": "Five surfaces that determine which roofer gets the call when the ceiling starts dripping. Every one of these is working right now — for you or against you.",

        "comparison": {
          "sub": "Roofing is one of the highest-trust, highest-dollar home service decisions. This is not about marketing. This is about whether the market can read your track record — or only your competitor's.",
          "trad": [
            "Pay for leads from HomeAdvisor or Angi. Compete on price with four other roofers.",
            "Run storm-chasing ads. Win a few. Burn most of the budget.",
            "Ask every customer for a review. Get some. Not enough to close the gap.",
            "Hire a marketing person. They post on Facebook. Nothing changes.",
            "Pay for SEO. Wait six months. Get a blog post about shingle types.",
            "Repeat seasonally. Start from scratch every spring."
          ],
          "neo": [
            "Every roof you install becomes a verified signal in that neighborhood — permanently.",
            "Your crews are already on site. The proof generates from the work itself.",
            "Review momentum, job activity, and location proof compound through every season.",
            "Visible across Google, Maps, and AI search — where the panic searches happen.",
            "Built for roofers who measure in squares, not impressions.",
            "After two storm seasons, your verified footprint is untouchable."
          ]
        },

        "footer_statement": "You've been on roofs in weather that would keep most people inside. Your operation is real. The market should know that — and right now, every homeowner who can't find you is finding someone else."
      },


      "exteriors_siding_windows": {
        "vertical_label": "Exteriors · Siding · Windows Edition",
        "hero_headline_line1": "YOU TRANSFORM HOMES.",
        "hero_headline_line2": "THE MARKET SEES A LISTING.",
        "hero_copy": "A siding job, a full window replacement, a complete exterior renovation — these are $20K to $80K decisions. The homeowner is not impulse buying. They are researching, comparing, and judging. And the first thing they judge is what the market shows them about you.",

        "cards": {
          "discovery": {
            "card_label": "What You Cannot Control",
            "titles": {
              "high": "You appear in searches. But in exteriors, appearing isn't converting.",
              "mid": "The homeowner who just signed a $40K siding contract never knew you existed.",
              "low": "You are invisible in a market where visibility is the qualifying round."
            },
            "bullet_templates": [
              "Maps position: {{maps_position}}. A homeowner spending $30K+ is checking every detail of the top results. They're not scrolling to find you.",
              "Exterior projects have long research cycles. If you're not visible at the start, you're not in the conversation at the end.",
              "AI search is already summarizing 'best exterior contractors in {{city}}.' Your name is not in those summaries."
            ]
          },
          "trust": {
            "card_label": "What Homeowners Judge Before The Estimate",
            "titles": {
              "high": "Your reviews are a strength. But in this price range, strength needs to be overwhelming.",
              "mid": "The homeowner narrowed it to two. The one with more proof got the walkthrough.",
              "low": "A homeowner is not handing a $40K project to the company with the thinnest track record."
            },
            "bullet_templates": [
              "{{review_count}} reviews at {{rating}}★. The exterior company they're comparing you to: {{peer_avg_reviews}} at {{peer_avg_rating}}★.",
              "Trend: {{rating_trend}}. At this dollar amount, homeowners read trends. A flat or declining trend is disqualifying.",
              "Homeowners mention: {{review_topics_summary}}. These words are shaping the decision more than your sales presentation."
            ]
          },
          "engagement": {
            "card_label": "The Minimum You Are Not Doing",
            "titles": {
              "high": "You respond. For projects this size, that is table stakes, not a differentiator.",
              "mid": "Someone gave you a $30K project and left you a review. You said nothing.",
              "low": "At this price point, silence is not neutral. Silence is disqualifying."
            },
            "bullet_templates": [
              "Response rate: {{owner_response_rate}}. A homeowner weighing a five-figure decision is reading every response — and judging the ones that aren't there.",
              "Last response: {{latest_response_date}}. The gap between that date and today is the gap in your credibility.",
              "In exteriors, a responded review is a portfolio piece. You are choosing to leave your portfolio empty."
            ]
          },
          "profile": {
            "card_label": "Your Showroom Is Empty",
            "titles": {
              "high": "Your profile is credible. Credible is the minimum in a $40K decision.",
              "mid": "Your profile says you exist. It doesn't say you're the one to trust with their home.",
              "low": "Your profile is costing you six-figure jobs."
            },
            "bullet_templates": [
              "{{photo_count}} photos. {{owner_photos}} from you. Exterior work is visual. If you're not showing transformations, you're hiding your best sales tool.",
              "Service options: {{service_options_summary}}. If 'siding installation' or 'window replacement' isn't there, the platform filters you out.",
              "In a visual trade, an incomplete gallery is a closed showroom. Homeowners walk past."
            ]
          },
          "competitive": {
            "card_label": "What Your Competitors Are Doing",
            "titles": {
              "high": "You're competitive. But the homeowner who's comparing has a spreadsheet. Not a feeling.",
              "mid": "The exterior company winning your market is not better at the install. They're better at being seen.",
              "low": "Your competitors are building walls of proof while you're building nothing visible."
            },
            "bullet_templates": [
              "{{similar_places_count}} exterior companies in your market.",
              "{{competitor_1_name}} has a stronger visible position. The homeowner doesn't know about your craftsmanship. They know about their profile.",
              "Every project your competitor documents widens the gap. These are $30K–$80K decisions going to whoever looks most established."
            ]
          },
          "neolocal_path": {
            "card_label": "What You Control Starting Now",
            "card_title": "Every project you complete is a portfolio piece the market should see.",
            "bullet_templates": [
              "Every siding job, every window install, every exterior transformation can become a verified signal. Right now, that $50K project you finished last month is invisible.",
              "Your work changes how homes look. Your online presence should reflect the same transformation.",
              "In exteriors, twelve months of verified project activity in a market makes you the established choice — not the option."
            ]
          }
        },

        "dimension_section_sub": "Five surfaces homeowners use to judge who gets a $30K–$80K project. You control some. You do not control others. Every one of them is filtering you in or out.",

        "comparison": {
          "sub": "Exterior work is the most visual trade in home services. The irony is that most exterior companies are the least visible online. This is about fixing that disconnect.",
          "trad": [
            "Hire a marketing agency. Get a website with stock photos of homes you didn't build.",
            "Run Facebook ads targeting homeowners. Hope they remember your name.",
            "Ask for reviews after every project. Some come. Most don't.",
            "Pay for SEO. Get ranked for 'siding tips' — not 'siding contractor near me.'",
            "No system to capture project proof. Your best work stays in the neighborhood.",
            "Every year starts fresh. No compounding."
          ],
          "neo": [
            "Every completed project becomes verified, location-tagged proof the market can see.",
            "Your work is the content. Before and after, every time, automatically.",
            "Trust signals compound — twelve months of documented projects builds an unassailable position.",
            "Visible across Google, Maps, and AI search where the high-value research happens.",
            "Built for exterior operators who sell five- and six-figure projects, not commodities.",
            "The more homes you transform, the stronger your market position becomes."
          ]
        },

        "footer_statement": "You change the way homes look. The market should reflect that — and every homeowner who can't find proof of what you do is finding a competitor whose proof is easier to see."
      },


      "new_used_dealerships": {
        "vertical_label": "New & Used Dealership Edition",
        "hero_headline_line1": "YOU RUN A REAL OPERATION.",
        "hero_headline_line2": "THE MARKET SEES A PIN ON A MAP.",
        "hero_copy": "Multi-rooftop, franchise, service department, F&I, pre-owned — you operate at a scale most businesses never reach. But the buyer Googling 'Honda dealer near me' doesn't see your operation. They see a listing. And the listing next to yours might belong to someone half your size who looks twice as credible.",

        "cards": {
          "discovery": {
            "card_label": "What You Cannot Control",
            "titles": {
              "high": "You're visible. But at your scale, visible is the baseline — not the advantage.",
              "mid": "A buyer searching your brand landed on the other dealer first. That was the entire decision.",
              "low": "You are operating at franchise scale with independent-level visibility."
            },
            "bullet_templates": [
              "Maps position: {{maps_position}}. Brand-name buyers expect to find you immediately. If they don't, they question the dealership, not the search engine.",
              "Multi-rooftop operations have more surface area to protect. One weak location drags the group.",
              "AI search is building dealer recommendations. Your DMS data is invisible to it. Your online signals are all it reads."
            ]
          },
          "trust": {
            "card_label": "What Buyers See Before The Test Drive",
            "titles": {
              "high": "Your review volume matches your scale. But so does the scrutiny.",
              "mid": "Your operation is larger than your online trust signals suggest. That gap is expensive.",
              "low": "You are a franchise-level operation with startup-level proof. That is a problem."
            },
            "bullet_templates": [
              "{{review_count}} reviews at {{rating}}★. Peer group: {{peer_avg_reviews}} at {{peer_avg_rating}}★.",
              "At your transaction volume, you should be generating trust signals faster than anyone in the market. The question is whether you are.",
              "{{review_topics_summary}} — this shapes perception across sales, service, and F&I."
            ]
          },
          "engagement": {
            "card_label": "The Minimum You Are Not Doing",
            "titles": {
              "high": "You respond consistently. At franchise scale, consistency is not optional — it's expected.",
              "mid": "You sell hundreds of units. You respond to a fraction of the reviews. That math doesn't work.",
              "low": "You are a multi-million dollar operation that cannot be bothered to acknowledge the people who pay for it."
            },
            "bullet_templates": [
              "Response rate: {{owner_response_rate}}. At your volume, this should be a managed process, not an afterthought.",
              "Last response: {{latest_response_date}}. Franchise buyers expect operational discipline. A stale response date contradicts that.",
              "Your sales floor follows up on every lead. Your review section should get the same discipline."
            ]
          },
          "profile": {
            "card_label": "Your Digital Showroom Has Dust On It",
            "titles": {
              "high": "Your profile reflects scale. But scale without polish reads as corporate, not credible.",
              "mid": "You have a $5M inventory and a profile that reads like a side hustle.",
              "low": "Your profile is the weakest salesperson on your team. And it talks to every buyer first."
            },
            "bullet_templates": [
              "{{photo_count}} photos. {{owner_photos}} from your team. You have a showroom, a service bay, and a lot. Show them.",
              "Service options: {{service_options_summary}}. If your service department isn't listed, you're invisible to the service search entirely.",
              "At franchise scale, an incomplete profile isn't a gap — it's a governance failure."
            ]
          },
          "competitive": {
            "card_label": "What Your Competitors Are Doing",
            "titles": {
              "high": "You're positioned well. But the dealer group across town is investing in widening the gap.",
              "mid": "The competitor getting your conquest buyers isn't outselling you. They're out-presenting you.",
              "low": "Smaller dealers in your market are projecting more trust than your operation. That should alarm you."
            },
            "bullet_templates": [
              "{{similar_places_count}} dealerships in your competitive set.",
              "{{competitor_1_name}} is outperforming you in visible market signals. That translates directly to floor traffic.",
              "Every month a competitor builds their visible presence, your conquest cost increases."
            ]
          },
          "neolocal_path": {
            "card_label": "What You Control Starting Now",
            "card_title": "Your operation should dominate this market. Start acting like it online.",
            "bullet_templates": [
              "Every unit delivered — new, used, service RO — is a signal that should feed your market presence. At your volume, that's a firehose of proof going unused.",
              "You already have the scale, the staff, and the transaction velocity. You just need the visible layer to match.",
              "In twelve months of compounding verified activity at your volume, you will not be competing. You will be the benchmark."
            ]
          }
        },

        "dimension_section_sub": "Five surfaces that determine whether your operation's scale translates into market dominance — or whether smaller dealers keep outperforming you online.",

        "comparison": {
          "sub": "You operate at scale. Your marketing should compound at scale too. This is about matching your visible market presence to the operation you've already built.",
          "trad": [
            "Franchise marketing program. Same template as every other dealer in the brand. No differentiation.",
            "Tier 3 agency. Monthly reports about impressions. Floor traffic stays flat.",
            "OEM mandated programs take budget but don't build local authority.",
            "Social media posting. Same car photos everyone else posts.",
            "Review management tool. Gets you responses. Doesn't build compounding presence.",
            "Every year, same budget, same playbook, same results."
          ],
          "neo": [
            "Every sale, every service RO, every delivery becomes a verified signal in your market — automatically.",
            "Your transaction velocity is the engine. No content creation required.",
            "Multi-location? Each rooftop builds its own compounding footprint.",
            "Discoverable across Google, Maps, and AI search where the buyer journey starts.",
            "Built for dealer operators who think in units, gross, and market share — not clicks.",
            "At your volume, six months creates a visible advantage that would take a competitor years to match."
          ]
        },

        "footer_statement": "You built a real operation — staff, inventory, service, F&I. The market should see all of it. Right now, it sees a fraction. And every buyer who doesn't feel your scale goes to the dealership that at least looks the part."
      },


      "daycares_childcare": {
        "vertical_label": "Daycares & Childcare Edition",
        "hero_headline_line1": "YOU TAKE CARE OF THEIR CHILDREN.",
        "hero_headline_line2": "THEY CAN'T FIND YOU.",
        "hero_copy": "A parent choosing childcare is making the most trust-intensive decision of their life. They are not picking the cheapest option. They are picking the one that feels safest. And 'safe' starts with what the market shows them before they ever visit your center.",

        "cards": {
          "discovery": {
            "card_label": "What You Cannot Control",
            "titles": {
              "high": "You show up. But for parents, showing up is not the same as feeling safe.",
              "mid": "The parent who enrolled their child somewhere else last week never found your center.",
              "low": "You do not exist in the search that matters most to a worried parent."
            },
            "bullet_templates": [
              "Maps position: {{maps_position}}. A parent searching 'daycare near me' is not browsing. They're scanning for trust signals — fast.",
              "Childcare searches are local, urgent, and emotional. The first result that feels right wins.",
              "AI assistants are recommending childcare centers. If your visible presence is thin, you're not in the answer."
            ]
          },
          "trust": {
            "card_label": "What Parents Decide Before The Tour",
            "titles": {
              "high": "Your reviews reflect a real operation. But parents compare — and they compare obsessively.",
              "mid": "The parent chose the center with more reviews. Not better care. More proof.",
              "low": "You are asking a parent to trust you with their child based on almost no visible evidence."
            },
            "bullet_templates": [
              "{{review_count}} reviews at {{rating}}★. The center they're comparing you to: {{peer_avg_reviews}} at {{peer_avg_rating}}★.",
              "Trend: {{rating_trend}}. In childcare, a single dip triggers anxiety. Parents read patterns, not averages.",
              "Parents mention: {{review_topics_summary}}. These words are deciding enrollment before your tour does."
            ]
          },
          "engagement": {
            "card_label": "The Minimum You Are Not Doing",
            "titles": {
              "high": "You respond to parents. That is the bare minimum for a business that holds children.",
              "mid": "A parent left you a review about their child's experience. You said nothing.",
              "low": "You care for children for a living and you cannot respond to the parents who vouch for you. Think about what that signals."
            },
            "bullet_templates": [
              "Response rate: {{owner_response_rate}}. A parent reading your reviews is looking for one thing: does this center care? Your responses are the proof.",
              "Last response: {{latest_response_date}}. In childcare, a stale profile reads as a center that stopped paying attention.",
              "Responding to a parent's review is not PR. It is the most public proof that you value the relationship."
            ]
          },
          "profile": {
            "card_label": "Your First Impression Is Failing",
            "titles": {
              "high": "Your profile is functional. For a parent deciding on childcare, functional isn't enough.",
              "mid": "Your listing says you exist. It doesn't say their child will be safe.",
              "low": "Your profile is the reason parents don't book the tour."
            },
            "bullet_templates": [
              "{{photo_count}} photos. {{owner_photos}} from you. Parents want to see the rooms, the playground, the faces. They're seeing a building exterior.",
              "Services: {{service_options_summary}}. If infant care, after-school, or summer programs aren't listed, parents assume you don't offer them.",
              "In childcare, every missing detail creates doubt. And doubt sends parents to the next option."
            ]
          },
          "competitive": {
            "card_label": "What Other Centers Are Doing",
            "titles": {
              "high": "You're competitive. But in childcare, competitive isn't comforting — dominant is.",
              "mid": "The center that got the enrollment isn't better with children. They're better at looking like it.",
              "low": "Other centers in your area project more warmth, more proof, more care — online. Whether or not it's true."
            },
            "bullet_templates": [
              "{{similar_places_count}} childcare centers in your area.",
              "{{competitor_1_name}} has a stronger visible trust profile. That's where the enrollment went.",
              "Every month a competing center adds reviews and parent engagement, their waitlist grows and yours doesn't."
            ]
          },
          "neolocal_path": {
            "card_label": "What You Control Starting Now",
            "card_title": "You already earn trust every day. The market should reflect it.",
            "bullet_templates": [
              "Every child you care for, every parent who trusts you, every milestone in your center — these can become visible proof that builds your reputation automatically.",
              "You don't need a marketing department. You need the trust you already earn to be visible where parents search.",
              "In childcare, six months of consistent, verified activity creates a waitlist. Twelve months makes you the center parents recommend to other parents."
            ]
          }
        },

        "dimension_section_sub": "Five surfaces parents use to decide where their child goes. Trust is not optional here. It is the entire decision.",

        "comparison": {
          "sub": "Parents don't choose childcare from ads. They choose from trust. This is about making the trust you've already built visible where it matters.",
          "trad": [
            "Post on Facebook. Get likes from existing parents. New parents never see it.",
            "Run local ads. Compete on price with centers that undercut you.",
            "Ask parents for reviews at pickup. Some remember. Most forget.",
            "Build a nice website. Parents check Google first anyway.",
            "Print flyers. Drop them off at pediatrician offices. Hope for the best.",
            "Every enrollment season, start the same hustle from scratch."
          ],
          "neo": [
            "Every day of care, every parent interaction, every verified moment becomes a signal the market reads.",
            "Your center's real activity becomes the content. No posting required.",
            "Trust compounds — six months of consistent signals builds a reputation that outlasts any ad campaign.",
            "Visible across Google, Maps, and AI search where anxious parents start their search.",
            "Built for childcare operators who measure in enrolled families, not followers.",
            "The longer you operate, the more the market trusts you — and the harder it is for a new center to compete."
          ]
        },

        "footer_statement": "Parents trust you with the thing they love most. The market should see that trust — and right now, every parent who can't find proof of who you are is choosing a center where the proof is easier to see."
      }

    }

  };
}
