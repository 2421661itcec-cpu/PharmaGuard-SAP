const routeTemplates = [
  {
    id_suffix: "ROAD",
    name: "Alternate Road Route",
    eta_hours: 4,
    risk: "LOW",
    cost_level: "LOW",
    description:
      "Use an alternate road corridor that bypasses the disrupted location."
  },
  {
    id_suffix: "HUB",
    name: "Alternate Distribution Hub",
    eta_hours: 7,
    risk: "MEDIUM",
    cost_level: "MEDIUM",
    description:
      "Redirect the shipment through an alternate distribution location."
  },
  {
    id_suffix: "AIR",
    name: "Emergency Air Freight",
    eta_hours: 2,
    risk: "LOW",
    cost_level: "HIGH",
    description:
      "Use emergency air freight to prioritize delivery of medicine."
  }
];

function buildRoute(shipment, option) {
  const origin = shipment.origin;
  const destination = shipment.destination;

  if (
    option.id_suffix === "ROAD"
  ) {
    if (
      origin === "Delhi" &&
      destination === "Chandigarh"
    ) {
      return "Delhi → Panipat → Chandigarh";
    }

    if (
      origin === "Ambala" &&
      destination === "Amritsar"
    ) {
      return "Ambala → Ludhiana → Amritsar";
    }

    return `${origin} → Alternate Road Corridor → ${destination}`;
  }

  if (
    option.id_suffix === "HUB"
  ) {
    if (
      origin === "Delhi" &&
      destination === "Chandigarh"
    ) {
      return "Delhi → Ludhiana → Chandigarh";
    }

    if (
      origin === "Ambala" &&
      destination === "Amritsar"
    ) {
      return "Ambala → Ludhiana → Amritsar";
    }

    return `${origin} → Alternate Distribution Hub → ${destination}`;
  }

  if (
    option.id_suffix === "AIR"
  ) {
    return `${origin} → ${destination} (Air Freight)`;
  }

  return `${origin} → ${destination}`;
}

function calculateScore(
  plan,
  impactResult,
  shipment
) {
  let score = 0;

  // Faster plans receive higher scores.
  if (plan.eta_hours <= 2) {
    score += 40;
  } else if (plan.eta_hours <= 4) {
    score += 30;
  } else {
    score += 20;
  }

  // Lower risk receives a higher score.
  if (plan.risk === "LOW") {
    score += 30;
  } else if (plan.risk === "MEDIUM") {
    score += 20;
  } else {
    score += 10;
  }

  // Lower cost receives a higher score.
  if (plan.cost_level === "LOW") {
    score += 20;
  } else if (plan.cost_level === "MEDIUM") {
    score += 15;
  } else {
    score += 5;
  }

  // Critical shipments receive additional priority
  // for low-risk recovery options.
  if (
    shipment.priority === "Critical" &&
    plan.risk === "LOW"
  ) {
    score += 10;
  }

  // Critical disruption favors low-risk recovery.
  if (
    impactResult.overall_impact === "CRITICAL" &&
    plan.risk === "LOW"
  ) {
    score += 10;
  }

  return score;
}

function generateScenarios(impactResult) {
  /*
   * PG2 already provides complete affected shipment
   * objects, so PG3 uses those directly.
   */
  const affectedShipments =
    impactResult.affected_shipments || [];

  const shipmentPlans =
    affectedShipments.map((shipment) => {
      const scoredPlans =
        routeTemplates.map((template) => {
          const plan = {
            id:
              `${shipment.shipment_id}-${template.id_suffix}`,

            shipment_id:
              shipment.shipment_id,

            medicine:
              shipment.medicine,

            priority:
              shipment.priority,

            origin:
              shipment.origin,

            destination:
              shipment.destination,

            name:
              template.name,

            route:
              buildRoute(
                shipment,
                template
              ),

            eta_hours:
              template.eta_hours,

            risk:
              template.risk,

            cost_level:
              template.cost_level,

            description:
              template.description
          };

          return {
            ...plan,

            score:
              calculateScore(
                plan,
                impactResult,
                shipment
              )
          };
        });

      scoredPlans.sort(
        (a, b) =>
          b.score - a.score
      );

      return {
        shipment_id:
          shipment.shipment_id,

        medicine:
          shipment.medicine,

        priority:
          shipment.priority,

        origin:
          shipment.origin,

        destination:
          shipment.destination,

        recommended_plan:
          scoredPlans[0].id,

        plans:
          scoredPlans.map(
            (plan, index) => ({
              rank: index + 1,
              ...plan
            })
          )
      };
    });

  return {
    planning_status: "COMPLETED",

    overall_impact:
      impactResult.overall_impact,

    affected_shipment_count:
      affectedShipments.length,

    shipment_plans:
      shipmentPlans
  };
}

module.exports = {
  generateScenarios
};