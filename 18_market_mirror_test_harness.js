/**
 * File: 17_market_mirror_test_harness.js
 * NeoLocal Market Mirror — sample inputs / quick test utilities
 */
var MM = typeof MM !== "undefined" ? MM : {};

function getMarketMirrorSampleInput_(vertical) {
  if (vertical === "auto_retail") {
    return {
      vertical_key: "auto_retail",
      observed: {
        business_name: "Metro Choice Auto",
        niche: "used car dealership",
        city: "Laval",
        neighborhood: "North Shore",
        rating: 4.5,
        reviews_count: 68,
        competitor_avg_reviews: 211,
        competitor_max_reviews: 486,
        competitor_count_sampled: 5,
        has_website: true,
        has_phone: true,
        has_hours: true,
        has_services: false,
        has_posts: false,
        photo_count_band: "healthy",
        secondary_categories_count: 2,
        has_attributes: true,
        business_model_visible: "dealer",
        map_pack_presence: "yes",
        primary_category_match: "strong",
        offers_service: true
      },
      rep: {
        inventory_band: "40-100",
        rooftop_count: "1",
        sales_team_band: "4-8",
        business_type: "independent",
        service_department: "yes",
        financing_model: "mixed",
        inventory_positioning: "mainstream",
        merchandising_quality: "average",
        market_density: "heavy",
        language_market_fit: "strong bilingual"
      }
    };
  }

  if (vertical === "hvac") {
    return {
      vertical_key: "hvac",
      observed: {
        business_name: "NorthFlow HVAC",
        niche: "hvac contractor",
        city: "Montreal",
        neighborhood: "West Island",
        rating: 4.7,
        reviews_count: 54,
        competitor_avg_reviews: 173,
        competitor_max_reviews: 412,
        competitor_count_sampled: 5,
        has_website: true,
        has_phone: true,
        has_hours: true,
        has_services: true,
        has_posts: false,
        photo_count_band: "light",
        secondary_categories_count: 3,
        has_attributes: true,
        business_model_visible: "contractor",
        map_pack_presence: "yes",
        primary_category_match: "strong",
        offers_service: true
      },
      rep: {
        truck_count_band: "3-6",
        team_band: "4-8",
        service_mix: "both",
        emergency_service: "yes",
        maintenance_plans: "yes",
        install_focus: "yes",
        service_focus: "yes",
        financing_available: "yes",
        territory_breadth: "metro",
        seasonality_pressure: "high",
        dispatcher_capacity: "medium",
        market_density: "heavy"
      }
    };
  }

  if (vertical === "roofing") {
    return {
      vertical_key: "roofing",
      observed: {
        business_name: "Summit Shield Roofing",
        niche: "roofing contractor",
        city: "Montreal",
        neighborhood: "South Shore",
        rating: 4.6,
        reviews_count: 41,
        competitor_avg_reviews: 152,
        competitor_max_reviews: 301,
        competitor_count_sampled: 5,
        has_website: true,
        has_phone: true,
        has_hours: true,
        has_services: true,
        has_posts: false,
        photo_count_band: "light",
        secondary_categories_count: 2,
        has_attributes: true,
        business_model_visible: "contractor",
        map_pack_presence: "yes",
        primary_category_match: "strong",
        offers_service: false
      },
      rep: {
        crew_count_band: "3-6",
        truck_count_band: "3-5",
        service_mix: "both",
        residential_or_commercial: "residential",
        emergency_response: "yes",
        insurance_claim_support: "yes",
        financing_available: "yes",
        territory_breadth: "metro",
        storm_dependency: "moderate",
        visual_proof_quality: "strong",
        estimate_process_strength: "average",
        market_density: "moderate"
      }
    };
  }

  return { observed: {}, rep: {} };
}

function testMarketMirrorPayload_(vertical) {
  var input = getMarketMirrorSampleInput_(vertical);
  var payload = buildMarketMirrorPayload_(input);
  Logger.log(JSON.stringify(payload, null, 2));
  return payload;
}

function testMarketMirrorHtml_(vertical) {
  var payload = buildMarketMirrorPayload_(getMarketMirrorSampleInput_(vertical));
  var html = renderMarketMirrorHtml_(payload);
  Logger.log(html.substring(0, 2500));
  return html;
}

function testRepSupportSheetHtml_(vertical) {
  var payload = buildMarketMirrorPayload_(getMarketMirrorSampleInput_(vertical));
  var html = renderRepSupportSheetHtml_(payload);
  Logger.log(html.substring(0, 2500));
  return html;
}
