/**
 * File: 07_vertical_profiles.gs
 * Vertical profile system
 */

/* ============================================================================
   VERTICAL DETECTION
============================================================================ */

function determineVerticalType_(obj) {
  const raw = [
    obj.vertical_key,
    obj.category,
    obj.niche,
    obj.full_query,
    obj.business_name
  ].filter(Boolean).join(" ").toLowerCase();

  // AUTO RETAIL / USED CAR DEALERSHIPS
  if (
    raw.indexOf("used car") !== -1 ||
    raw.indexOf("used cars") !== -1 ||
    raw.indexOf("car dealership") !== -1 ||
    raw.indexOf("car dealer") !== -1 ||
    raw.indexOf("auto dealer") !== -1 ||
    raw.indexOf("dealership") !== -1 ||
    raw.indexOf("pre-owned") !== -1 ||
    raw.indexOf("automobile dealer") !== -1
  ) {
    return "auto_retail";
  }

  // JUNK REMOVAL / CLEANOUT
  if (
    raw.indexOf("junk removal") !== -1 ||
    raw.indexOf("garbage removal") !== -1 ||
    raw.indexOf("cleanout") !== -1 ||
    raw.indexOf("decluttering") !== -1 ||
    raw.indexOf("debris removal") !== -1 ||
    raw.indexOf("trash removal") !== -1
  ) {
    return "junk_removal";
  }

  // KITCHEN / CABINET REFACING
  if (
    raw.indexOf("kitchen refacing") !== -1 ||
    raw.indexOf("cabinet refacing") !== -1 ||
    raw.indexOf("cabinet refinishing") !== -1 ||
    raw.indexOf("kitchen remodel") !== -1
  ) {
    return "kitchen_refacing";
  }

  // HVAC
  if (
    raw.indexOf("hvac") !== -1 ||
    raw.indexOf("heating") !== -1 ||
    raw.indexOf("air conditioning") !== -1 ||
    raw.indexOf("furnace") !== -1 ||
    raw.indexOf("heat pump") !== -1
  ) {
    return "hvac";
  }

  // ROOFING
  if (
    raw.indexOf("roofing") !== -1 ||
    raw.indexOf("roofer") !== -1 ||
    raw.indexOf("roof repair") !== -1 ||
    raw.indexOf("roof replacement") !== -1
  ) {
    return "roofing";
  }

  // TREE SERVICE
  if (
    raw.indexOf("tree service") !== -1 ||
    raw.indexOf("tree removal") !== -1 ||
    raw.indexOf("arborist") !== -1 ||
    raw.indexOf("stump grinding") !== -1
  ) {
    return "tree_service";
  }

  // CLEANING
  if (
    raw.indexOf("cleaning service") !== -1 ||
    raw.indexOf("house cleaning") !== -1 ||
    raw.indexOf("office cleaning") !== -1 ||
    raw.indexOf("commercial cleaning") !== -1
  ) {
    return "cleaning_service";
  }

  // DEFAULT
  return "local_service";
}

/* ============================================================================
   VERTICAL PROFILES
============================================================================ */

function getVerticalProfile_(verticalKey) {
  const profiles = {
    auto_retail: {
      vertical_key: "auto_retail",
      label: "Used Car Dealership",
      buyer_type: "vehicle shopper",
      trust_driver: "visible buyer confidence and dealership safety",
      primary_risk: "screened out before inventory comparison",
      default_choice_language: "safer dealership choice",
      proof_language: "visible customer experience",
      offer_language: "inventory, financing, and purchase confidence",
      template_family: "auto_retail"
    },

    junk_removal: {
      vertical_key: "junk_removal",
      label: "Junk Removal",
      buyer_type: "urgent local service buyer",
      trust_driver: "speed, legitimacy, and professionalism",
      primary_risk: "skipped before call or quote request",
      default_choice_language: "safer service choice",
      proof_language: "visible service proof",
      offer_language: "response speed, reliability, and job execution",
      template_family: "local_service"
    },

    kitchen_refacing: {
      vertical_key: "kitchen_refacing",
      label: "Kitchen Refacing",
      buyer_type: "high-consideration homeowner",
      trust_driver: "craftsmanship, legitimacy, and project confidence",
      primary_risk: "doubt before consultation",
      default_choice_language: "safer renovation choice",
      proof_language: "visible project proof",
      offer_language: "consultation confidence, workmanship, and design trust",
      template_family: "home_project"
    },

    hvac: {
      vertical_key: "hvac",
      label: "HVAC",
      buyer_type: "home service buyer",
      trust_driver: "responsiveness, competence, and reliability",
      primary_risk: "lost before service contact",
      default_choice_language: "safer contractor choice",
      proof_language: "visible service credibility",
      offer_language: "response time, professionalism, and service trust",
      template_family: "local_service"
    },

    roofing: {
      vertical_key: "roofing",
      label: "Roofing",
      buyer_type: "high-value homeowner",
      trust_driver: "credibility, proof, and project safety",
      primary_risk: "doubt before estimate request",
      default_choice_language: "safer roofing choice",
      proof_language: "visible project credibility",
      offer_language: "estimate confidence, workmanship, and contractor trust",
      template_family: "home_project"
    },

    tree_service: {
      vertical_key: "tree_service",
      label: "Tree Service",
      buyer_type: "property owner",
      trust_driver: "professionalism, safety, and visible experience",
      primary_risk: "screened out before quote request",
      default_choice_language: "safer service provider",
      proof_language: "visible job proof",
      offer_language: "safety, reliability, and execution confidence",
      template_family: "local_service"
    },

    cleaning_service: {
      vertical_key: "cleaning_service",
      label: "Cleaning Service",
      buyer_type: "home or business cleaning buyer",
      trust_driver: "reliability, professionalism, and consistency",
      primary_risk: "skipped before inquiry",
      default_choice_language: "safer cleaning choice",
      proof_language: "visible trust proof",
      offer_language: "consistency, professionalism, and service confidence",
      template_family: "local_service"
    },

    local_service: {
      vertical_key: "local_service",
      label: "Local Service",
      buyer_type: "local buyer",
      trust_driver: "visible proof and legitimacy",
      primary_risk: "filtered out before serious consideration",
      default_choice_language: "safer local choice",
      proof_language: "visible public proof",
      offer_language: "service credibility and buyer confidence",
      template_family: "local_service"
    }
  };

  return profiles[verticalKey] || profiles.local_service;
}