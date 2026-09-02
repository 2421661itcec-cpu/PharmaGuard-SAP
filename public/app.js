let recoveryData = null;
let selectedPlan = null;
let latestApproval = null;


// ==================================================
// HELPERS
// ==================================================

function $(id) {
  return document.getElementById(id);
}


function show(id) {
  const element = $(id);

  if (element) {
    element.classList.remove("hidden");
  }
}


function hide(id) {
  const element = $(id);

  if (element) {
    element.classList.add("hidden");
  }
}


function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function showToast(message) {
  const toast = $("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(window.pharmaGuardToastTimer);

  window.pharmaGuardToastTimer =
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3500);
}


async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw new Error(
      `Server returned an invalid response (${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      `Request failed with status ${response.status}.`
    );
  }

  return data;
}


// ==================================================
// AGENT PIPELINE
// ==================================================

function resetPipeline() {
  const nodes = [
    "pipeline-disruption",
    "pipeline-impact",
    "pipeline-scenario",
    "pipeline-human",
    "pipeline-rerouting",
    "pipeline-inventory",
    "pipeline-recovery"
  ];

  nodes.forEach(id => {
    const node = $(id);

    if (node) {
      node.classList.remove(
        "completed",
        "active",
        "blocked"
      );
    }
  });

  const state =
    document.querySelector(".pipeline-state");

  if (state) {
    state.textContent = "READY";
  }
}


function setPipelineState(
  id,
  state
) {
  const node = $(id);

  if (!node) {
    return;
  }

  node.classList.remove(
    "completed",
    "active",
    "blocked"
  );

  if (state) {
    node.classList.add(state);
  }
}


function updatePipeline(
  stage,
  finalStatus = null
) {
  resetPipeline();

  const order = [
    "pipeline-disruption",
    "pipeline-impact",
    "pipeline-scenario",
    "pipeline-human",
    "pipeline-rerouting",
    "pipeline-inventory",
    "pipeline-recovery"
  ];

  const index =
    order.indexOf(stage);

  if (index >= 0) {
    order
      .slice(0, index + 1)
      .forEach(id => {
        setPipelineState(
          id,
          "completed"
        );
      });
  }

  if (stage) {
    setPipelineState(
      stage,
      "active"
    );
  }

  if (finalStatus === "REJECTED") {
    setPipelineState(
      "pipeline-human",
      "blocked"
    );

    setPipelineState(
      "pipeline-rerouting",
      "blocked"
    );

    setPipelineState(
      "pipeline-inventory",
      "blocked"
    );

    setPipelineState(
      "pipeline-recovery",
      "blocked"
    );
  }

  if (finalStatus === "SUCCESS") {
    order.forEach(id => {
      setPipelineState(
        id,
        "completed"
      );
    });
  }

  const state =
    document.querySelector(".pipeline-state");

  if (state) {

    if (finalStatus === "SUCCESS") {
      state.textContent = "COMPLETE";
    } else if (finalStatus === "REJECTED") {
      state.textContent = "BLOCKED";
    } else if (stage) {
      state.textContent = "IN PROGRESS";
    } else {
      state.textContent = "READY";
    }
  }
}


// ==================================================
// OPERATIONAL INTELLIGENCE
// ==================================================

function updateIntelligenceMetrics(
  result
) {
  const impact =
    result?.impact || {};

  const shipments =
    impact.affected_shipments || [];

  const plans =
    getAllPlans(result);


  const shipmentMetric =
    $("affectedShipmentsMetric");

  if (shipmentMetric) {
    shipmentMetric.textContent =
      impact.affected_shipment_count ??
      shipments.length ??
      0;
  }


  const severityMetric =
    $("severityMetric");

  if (severityMetric) {
    severityMetric.textContent =
      result?.disruption?.severity ||
      impact.overall_impact ||
      "—";
  }


  const plansMetric =
    $("recoveryPlansMetric");

  if (plansMetric) {
    plansMetric.textContent =
      plans.length;
  }


  const agentsMetric =
    $("activeAgentsMetric");

  if (agentsMetric) {
    agentsMetric.textContent = "7";
  }
}


// ==================================================
// STEP 01 — ANALYZE DISRUPTION
// ==================================================

async function analyzeDisruption() {

  const input =
    $("disruptionInput");

  const disruption =
    input
      ? input.value.trim()
      : "";


  if (!disruption) {
    showToast(
      "Please enter a disruption description."
    );

    return;
  }


  recoveryData = null;
  selectedPlan = null;
  latestApproval = null;


  hide("alertPanel");
  hide("impactSection");
  hide("scenarioSection");
  hide("decisionSummary");
  hide("approvalSection");
  hide("modifySection");
  hide("executionSection");
  hide("executionTimelineSection");
  hide("auditSection");


  resetPipeline();


  show("loadingPanel");


  const analyzeButton =
    $("analyzeButton");

  if (analyzeButton) {
    analyzeButton.disabled = true;
  }


  try {

    updatePipeline(
      "pipeline-disruption"
    );


    const result =
      await api(
        "/api/pharmaguard/recovery",
        {
          method: "POST",

          body: JSON.stringify({
            disruption
          })
        }
      );


    recoveryData = result;


    updateIntelligenceMetrics(
      result
    );


    renderDisruption(
      result
    );


    renderImpact(
      result
    );


    renderScenarios(
      result
    );


    updatePipeline(
      "pipeline-scenario"
    );


    show("alertPanel");
    show("impactSection");
    show("scenarioSection");
    show("approvalSection");


    selectRecommendedPlan();


    showToast(
      "AI analysis completed. Human approval required."
    );


  } catch (error) {

    console.error(
      "Disruption analysis error:",
      error
    );


    showToast(
      error.message
    );


  } finally {

    hide("loadingPanel");


    if (analyzeButton) {
      analyzeButton.disabled = false;
    }

  }
}


// ==================================================
// DISRUPTION
// ==================================================

function renderDisruption(result) {

  const disruption =
    result.disruption || {};

  const impact =
    result.impact || {};


  const title =
    $("disruptionTitle");

  if (title) {
    title.textContent =
      disruption.disruption ||
      disruption.description ||
      $("disruptionInput")?.value ||
      "Supply chain disruption";
  }


  const severity =
    $("severityValue");

  if (severity) {
    severity.textContent =
      disruption.severity ||
      impact.overall_impact ||
      "UNKNOWN";
  }


  const shipmentCount =
    impact.affected_shipment_count ??
    (impact.affected_shipments || []).length;


  const shipmentElement =
    $("shipmentCount");

  if (shipmentElement) {
    shipmentElement.textContent =
      shipmentCount;
  }


  const destinationCount =
    impact.affected_destination_count ??
    (impact.affected_destinations || []).length;


  const destinationElement =
    $("destinationCount");

  if (destinationElement) {
    destinationElement.textContent =
      destinationCount;
  }
}


// ==================================================
// IMPACT
// ==================================================

function renderImpact(result) {

  const impact =
    result.impact || {};

  const shipments =
    impact.affected_shipments || [];

  const container =
    $("impactCards");

  if (!container) {
    return;
  }


  container.innerHTML = "";


  shipments.forEach(
    shipment => {
      const isUrgent = Boolean(shipment.is_emergency || shipment.is_deficit || shipment.urgency_tier?.includes("PRIORITY_1") || String(shipment.priority).toLowerCase() === "critical");

      const priorityBadge = shipment.urgency_label || (isUrgent ? "🚨 PRIORITY: DEFICIENCY / EMERGENCY" : "ℹ️ LESS PRIOR: ROUTINE BUFFER");
      const priorityStyle = isUrgent
        ? "background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;font-weight:800;"
        : "background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;font-weight:700;";

      const coverage =
        shipment.days_of_inventory_coverage;

      const coverageText =
        coverage !== undefined && coverage !== null
          ? `${coverage} days`
          : "—";

      container.innerHTML += `
        <article class="shipment-card" style="border-left: 4px solid ${isUrgent ? '#dc2626' : '#0284c7'};">
          <div class="shipment-top">
            <div class="shipment-id">
              ${escapeHtml(shipment.shipment_id)}
            </div>
            <div class="priority-badge" style="${priorityStyle}padding:4px 9px;font-size:11px;border-radius:6px;">
              ${escapeHtml(priorityBadge)}
            </div>
          </div>

          <div class="shipment-medicine" style="margin-top:6px;">
            ${escapeHtml(shipment.medicine)}
          </div>

          <div class="route" style="margin:6px 0;">
            <div style="font-size:13px;font-weight:700;color:#0f172a;">
              🏁 Final Destination: <span style="color:#0f5bd3;">${escapeHtml(shipment.destination || "—")}</span>
            </div>
            <div style="font-size:11.5px;color:#64748b;margin-top:2px;">
              Corridor: ${escapeHtml(shipment.current_route || `${shipment.origin || ""} → ${shipment.destination || ""}`)}
            </div>
          </div>

          ${shipment.priority_note ? `
            <div style="font-size:11.5px;padding:6px 10px;border-radius:6px;margin:8px 0;background:${isUrgent ? '#fff1f2' : '#f0f9ff'};color:${isUrgent ? '#9f1239' : '#0369a1'};border:1px solid ${isUrgent ? '#fecdd3' : '#e0f2fe'};line-height:1.4;">
              ${escapeHtml(shipment.priority_note)}
            </div>
          ` : ""}

          <div class="metrics">
            <div class="metric">
              <span>PRIORITY</span>
              <strong style="color:${isUrgent ? '#b91c1c' : '#0369a1'};">
                ${isUrgent ? 'CRITICAL (HIGH)' : 'ROUTINE (LESS)'}
              </strong>
            </div>

            <div class="metric">
              <span>DELAY RISK</span>
              <strong>
                ${escapeHtml(shipment.delay_risk || "—")}
              </strong>
            </div>

            <div class="metric">
              <span>INVENTORY COVERAGE</span>
              <strong>
                ${escapeHtml(coverageText)}
              </strong>
            </div>
          </div>
        </article>
      `;
    }
  );



  if (!shipments.length) {

    container.innerHTML = `
      <div class="shipment-card">
        No affected shipments returned.
      </div>
    `;

  }
}


// ==================================================
// SCENARIOS
// ==================================================

function getAllPlans(result) {

  const scenarios =
    result?.scenarios || {};


  let plans = [];


  const shipmentPlans =
    scenarios.shipment_plans || [];


  shipmentPlans.forEach(
    shipment => {

      if (
        shipment.plans &&
        Array.isArray(shipment.plans)
      ) {

        plans.push(
          ...shipment.plans
        );

      }

    }
  );


  if (
    scenarios.plans &&
    Array.isArray(scenarios.plans)
  ) {

    plans.push(
      ...scenarios.plans
    );

  }


  const uniquePlans =
    new Map();


  plans.forEach(plan => {

    if (
      plan &&
      plan.id
    ) {

      uniquePlans.set(
        plan.id,
        plan
      );

    }

  });


  plans =
    Array.from(
      uniquePlans.values()
    );


  plans.sort(
    (a, b) =>
      Number(a.rank || 999) -
      Number(b.rank || 999)
  );


  return plans;
}


function renderScenarios(result) {

  const plans =
    getAllPlans(result);

  const container =
    $("scenarioCards");

  if (!container) {
    return;
  }


  container.innerHTML = "";


  plans.forEach(
    plan => {

      const selected =
        selectedPlan &&
        selectedPlan.id === plan.id;


      const card =
        document.createElement("article");


      card.className =
        `scenario-card ${
          selected
            ? "selected"
            : ""
        }`;


      card.dataset.planId =
        plan.id;


      const isUrgent = Boolean(plan.is_emergency || plan.is_deficit || plan.urgency_tier?.includes("PRIORITY_1") || String(plan.priority).toLowerCase() === "critical");
      const badgeText = plan.urgency_label || (isUrgent ? "🚨 PRIORITY: DEFICIT / EMERGENCY" : "ℹ️ LESS PRIOR: ROUTINE BUFFER");
      const badgeStyle = isUrgent
        ? "background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;font-weight:800;"
        : "background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;font-weight:700;";

      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div class="rank">
            RANK #${escapeHtml(plan.rank)}
          </div>
          <div class="scenario-urgency-tag" style="${badgeStyle}font-size:10.5px;padding:3px 8px;border-radius:6px;">
            ${escapeHtml(badgeText)}
          </div>
        </div>

        <h3 style="margin-bottom:4px;">
          ${escapeHtml(plan.name)}
        </h3>

        <div style="font-size:12.5px;font-weight:700;color:#0f5bd3;margin-bottom:6px;">
          🏁 Final Destination: <span>${escapeHtml(plan.destination || "—")}</span>
        </div>

        <div class="scenario-route">
          ${escapeHtml(plan.route)}
        </div>



        <div class="scenario-metrics">

          <div class="scenario-metric">
            ETA ${escapeHtml(
              plan.eta_hours
            )}h
          </div>

          <div class="scenario-metric">
            RISK ${escapeHtml(
              plan.risk
            )}
          </div>

          <div class="scenario-metric">
            COST ${escapeHtml(
              plan.cost_level
            )}
          </div>

          <div class="scenario-metric">
            SCORE ${escapeHtml(
              plan.score
            )}
          </div>

        </div>


        <button
          type="button"
          class="select-plan-button"
        >
          ${
            selected
              ? "✓ Selected"
              : "Select This Plan"
          }
        </button>

      `;


      card
        .querySelector(
          ".select-plan-button"
        )
        .addEventListener(
          "click",
          () => {
            selectPlan(plan);
          }
        );


      container.appendChild(
        card
      );

    }
  );


  if (!plans.length) {

    container.innerHTML = `
      <div class="shipment-card">
        No recovery scenarios returned.
      </div>
    `;

  }
}


// ==================================================
// SELECT RECOMMENDED PLAN
// ==================================================

function selectRecommendedPlan() {

  if (!recoveryData) {
    return;
  }


  const scenarios =
    recoveryData.scenarios || {};

  const plans =
    getAllPlans(
      recoveryData
    );


  if (
    scenarios.recommended_plan
  ) {

    const recommended =
      plans.find(
        plan =>
          plan.id ===
          scenarios.recommended_plan
      );


    if (recommended) {
      selectPlan(
        recommended
      );

      return;
    }

  }


  if (plans.length) {
    selectPlan(
      plans[0]
    );
  }
}


// ==================================================
// SELECT PLAN
// ==================================================

function selectPlan(plan) {

  if (
    !plan ||
    !plan.id
  ) {

    showToast(
      "Invalid recovery plan."
    );

    return;
  }


  selectedPlan = {
    ...plan
  };


  renderScenarios(
    recoveryData
  );


  renderSelectedPlan();


  renderDecisionSummary(
    selectedPlan
  );


  show(
    "decisionSummary"
  );


  show(
    "approvalSection"
  );


  hide(
    "modifySection"
  );


  latestApproval = null;


  updatePipeline(
    "pipeline-human"
  );
}


// ==================================================
// SELECTED PLAN
// ==================================================

function renderSelectedPlan() {

  const container =
    $("selectedPlan");

  if (!container) {
    return;
  }


  if (!selectedPlan) {

    container.innerHTML = `
      <p>No plan selected.</p>
    `;

    return;
  }

  const isUrgent = Boolean(selectedPlan.is_emergency || selectedPlan.is_deficit || selectedPlan.urgency_tier?.includes("PRIORITY_1") || String(selectedPlan.priority).toLowerCase() === "critical");

  const badgeText = selectedPlan.urgency_label || (isUrgent ? "🚨 PRIORITY: DEFICIT / EMERGENCY" : "ℹ️ LESS PRIOR: ROUTINE BUFFER");
  const badgeStyle = isUrgent
    ? "background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;font-weight:800;"
    : "background:#e0f2fe;color:#0369a1;border:1px solid #bae6fd;font-weight:700;";

  container.innerHTML = `
    <div class="selected-plan-header">
      <div>
        <strong>
          ${escapeHtml(selectedPlan.name)}
        </strong>
        <span class="selected-plan-id" style="margin-left:6px;">
          ${escapeHtml(selectedPlan.id)}
        </span>
      </div>
      <div style="${badgeStyle}padding:3px 8px;font-size:11px;border-radius:6px;">
        ${escapeHtml(badgeText)}
      </div>
    </div>

    <div style="font-size:12.5px;font-weight:700;color:#0f5bd3;margin:4px 0;">
      🏁 Final Destination: <span>${escapeHtml(selectedPlan.destination || "—")}</span>
    </div>

    <div class="selected-plan-route">
      ${escapeHtml(selectedPlan.route)}
    </div>

    <div class="scenario-metrics">
      <div class="scenario-metric">
        ETA ${escapeHtml(selectedPlan.eta_hours)}h
      </div>

      <div class="scenario-metric">
        RISK ${escapeHtml(selectedPlan.risk)}
      </div>

      <div class="scenario-metric">
        COST ${escapeHtml(selectedPlan.cost_level)}
      </div>
    </div>
  `;
}



// ==================================================
// AI DECISION SUMMARY
// ==================================================

function renderDecisionSummary(
  plan
) {

  const container =
    $("recommendationContent");

  if (!container || !plan) {
    return;
  }


  const score =
    plan.score ??
    plan.rank ??
    "—";


  const reasons = [];


  if (plan.eta_hours !== undefined) {
    reasons.push(
      `Estimated recovery time: ${plan.eta_hours} hours`
    );
  }


  if (plan.risk) {
    reasons.push(
      `Operational risk: ${plan.risk}`
    );
  }


  if (plan.cost_level) {
    reasons.push(
      `Cost level: ${plan.cost_level}`
    );
  }


  if (!reasons.length) {
    reasons.push(
      "Plan selected from the AI-generated recovery scenarios."
    );
  }


  container.innerHTML = `

    <div class="recommendation-main">

      <div class="recommendation-plan">

        <h3>
          ${escapeHtml(
            plan.name ||
            "Recommended Recovery Plan"
          )}
        </h3>


        <p>
          ${escapeHtml(
            plan.route ||
            "Route information unavailable."
          )}
        </p>


        <div class="recommendation-stats">

          <div class="recommendation-stat">

            <span>
              AI SCORE
            </span>

            <strong>
              ${escapeHtml(
                score
              )}
            </strong>

          </div>


          <div class="recommendation-stat">

            <span>
              ETA
            </span>

            <strong>
              ${escapeHtml(
                plan.eta_hours ?? "—"
              )}h
            </strong>

          </div>


          <div class="recommendation-stat">

            <span>
              RISK
            </span>

            <strong>
              ${escapeHtml(
                plan.risk ?? "—"
              )}
            </strong>

          </div>

        </div>

      </div>


      <div class="recommendation-reasons">

        <h3>
          Decision Factors
        </h3>

        <ul class="reason-list">

          ${reasons
            .map(
              reason =>
                `<li>${escapeHtml(reason)}</li>`
            )
            .join("")}

        </ul>

      </div>

    </div>

  `;
}


// ==================================================
// APPROVE
// ==================================================

async function approveSelectedPlan() {

  if (!selectedPlan) {

    showToast(
      "Select a recovery plan first."
    );

    return;
  }


  try {

    setDecisionButtonsDisabled(
      true
    );


    const approval =
      await api(
        "/api/approval/approve",
        {
          method: "POST",

          body: JSON.stringify({
            plan: selectedPlan,

            decision_by:
              "Supply Chain Manager"
          })
        }
      );


    latestApproval =
      approval;


    updatePipeline(
      "pipeline-human"
    );


    showToast(
      "Plan approved. Executing recovery..."
    );


    await executeRecovery(
      approval
    );


  } catch (error) {

    console.error(
      "Approval error:",
      error
    );


    showToast(
      error.message
    );


  } finally {

    setDecisionButtonsDisabled(
      false
    );

  }
}


// ==================================================
// REJECT
// ==================================================

async function rejectSelectedPlan() {

  if (!selectedPlan) {

    showToast(
      "Select a recovery plan first."
    );

    return;
  }


  const reason =
    window.prompt(
      "Enter rejection reason:",
      "Manager selected a different recovery strategy"
    );


  if (reason === null) {
    return;
  }


  const cleanReason =
    reason.trim();


  if (!cleanReason) {

    showToast(
      "Rejection reason is required."
    );

    return;
  }


  try {

    setDecisionButtonsDisabled(
      true
    );


    const approval =
      await api(
        "/api/approval/reject",
        {
          method: "POST",

          body: JSON.stringify({
            plan: selectedPlan,

            reason:
              cleanReason,

            decision_by:
              "Supply Chain Manager"
          })
        }
      );


    latestApproval =
      approval;


    updatePipeline(
      "pipeline-human",
      "REJECTED"
    );


    hide(
      "modifySection"
    );


    hide(
      "executionSection"
    );


    showRejectionResult(
      approval
    );


    renderTimeline(
      "REJECTED",
      approval
    );


    renderAudit(
      "REJECTED",
      approval
    );


    showToast(
      "Plan rejected. Recovery execution blocked."
    );


  } catch (error) {

    console.error(
      "Rejection error:",
      error
    );


    showToast(
      error.message
    );


  } finally {

    setDecisionButtonsDisabled(
      false
    );

  }
}


// ==================================================
// REJECTION RESULT
// ==================================================

function showRejectionResult(
  approval
) {

  const container =
    $("executionSection");

  if (!container) {
    return;
  }


  show(
    "executionSection"
  );


  const status =
    $("executionStatus");

  const cards =
    $("executionCards");


  if (status) {

    status.innerHTML = `

      <strong>
        ✕ Recovery blocked by human decision
      </strong>

      <span>
        The Supply Chain Manager rejected
        the selected recovery plan.
      </span>

    `;

  }


  if (cards) {

    cards.innerHTML = `

      <article class="execution-card">

        <h3>
          HUMAN-IN-THE-LOOP DECISION
        </h3>

        <div class="execution-value">
          Plan Rejected
        </div>

        <div class="execution-description">

          Plan:
          ${escapeHtml(
            approval?.selected_plan?.name ||
            selectedPlan?.name ||
            "Recovery plan"
          )}

          <br>

          Decision by:
          ${escapeHtml(
            approval?.decision_by ||
            "Supply Chain Manager"
          )}

          <br>

          Reason:
          ${escapeHtml(
            approval?.decision_reason ||
            "Recovery plan rejected."
          )}

          <br>

          Status:
          RECOVERY_BLOCKED

        </div>

      </article>

    `;

  }


  container.scrollIntoView({
    behavior: "smooth"
  });
}


// ==================================================
// MODIFY PLAN
// ==================================================

function openModifyDialog() {

  if (!selectedPlan) {

    showToast(
      "Select a recovery plan first."
    );

    return;
  }


  const route =
    $("modifyRoute");

  const eta =
    $("modifyEta");

  const risk =
    $("modifyRisk");

  const cost =
    $("modifyCost");


  if (!route || !eta || !risk || !cost) {

    showToast(
      "Modification form is unavailable."
    );

    return;
  }


  route.value =
    selectedPlan.route ||
    "";


  const destInput = $("modifyDestination");
  if (destInput) {
    destInput.value = selectedPlan.destination || "";
    destInput.oninput = () => {
      const newD = destInput.value.trim();
      if (newD && route.value) {
        const segs = route.value.split(/→|->/).map(s => s.trim()).filter(Boolean);
        if (segs.length > 1) {
          segs[segs.length - 1] = newD;
          route.value = segs.join(" → ");
        } else if (segs.length === 1) {
          route.value = `${segs[0]} → ${newD}`;
        }
      }
    };
  }

  route.oninput = () => {
    const segs = route.value.split(/→|->/).map(s => s.trim()).filter(Boolean);
    if (segs.length > 1 && destInput) {
      destInput.value = segs[segs.length - 1];
    }
  };

  eta.value =
    selectedPlan.eta_hours ||
    "";


  risk.value =
    selectedPlan.risk ||
    "LOW";


  cost.value =
    selectedPlan.cost_level ||
    "LOW";


  show(
    "modifySection"
  );


  $("modifySection").scrollIntoView({
    behavior: "smooth"
  });


  setTimeout(
    () => {
      if (destInput) {
        destInput.focus();
        destInput.select();
      } else {
        route.focus();
        route.select();
      }
    },
    200
  );
}


// ==================================================
// CLOSE MODIFY
// ==================================================

function closeModifyDialog() {

  hide(
    "modifySection"
  );
}


// ==================================================
// SUBMIT MODIFICATION
// ==================================================

async function submitModification() {

  if (!selectedPlan) {

    showToast(
      "Select a recovery plan first."
    );

    return;
  }


  const route =
    $("modifyRoute")?.value.trim();

  const destinationInput =
    $("modifyDestination")?.value.trim() || "";

  const finalDestination =
    destinationInput || (route.split(/→|->/).map(s => s.trim()).filter(Boolean).pop());


  const etaValue =
    $("modifyEta")?.value;


  const risk =
    $("modifyRisk")?.value;


  const cost =
    $("modifyCost")?.value;


  if (!route) {

    showToast(
      "Modified route is required."
    );

    return;
  }


  const eta =
    Number(
      etaValue
    );


  if (
    !Number.isFinite(eta) ||
    eta <= 0
  ) {

    showToast(
      "Modified ETA must be greater than 0."
    );

    return;
  }


  if (!risk || !cost) {

    showToast(
      "Risk and cost are required."
    );

    return;
  }


  const modifications = {
    route,
    destination: finalDestination,
    shipment_id: selectedPlan.shipment_id,
    eta_hours: eta,
    risk,
    cost_level: cost
  };


  console.log(
    "MODIFY REQUEST:",
    {
      plan: selectedPlan,
      modifications
    }
  );


  try {

    setDecisionButtonsDisabled(
      true
    );


    const approval =
      await api(
        "/api/approval/modify",
        {
          method: "POST",

          body: JSON.stringify({
            plan: selectedPlan,

            modifications,

            decision_by:
              "Supply Chain Manager"
          })
        }
      );


    latestApproval =
      approval;


    console.log(
      "MODIFY RESULT:",
      approval
    );


    if (
      approval.modified_plan
    ) {

      selectedPlan = {
        ...approval.modified_plan
      };

    } else {

      selectedPlan = {
        ...selectedPlan,
        ...modifications
      };

    }

    // Immediately update Operational Impact and AI Scenarios with the modified destination
    if (approval.updated_impact) {
      recoveryData.impact = approval.updated_impact;
      renderImpact(recoveryData);
    }

    if (approval.updated_scenarios) {
      recoveryData.scenarios = approval.updated_scenarios;
      renderScenarios(recoveryData);
    }

    if (recoveryData.disruption) {
      renderKpis(recoveryData);
    }

    renderSelectedPlan();


    renderDecisionSummary(
      selectedPlan
    );


    hide(
      "modifySection"
    );


    showToast(
      `Plan modified to destination: ${selectedPlan.destination || 'updated'}. Executing recovery...`
    );


    await executeRecovery(
      approval
    );



  } catch (error) {

    console.error(
      "Modification error:",
      error
    );


    showToast(
      error.message
    );


  } finally {

    setDecisionButtonsDisabled(
      false
    );

  }
}


// ==================================================
// EXECUTION
// ==================================================

async function executeRecovery(
  approval
) {

  if (!approval) {

    showToast(
      "Approval result is missing."
    );

    return;
  }


  if (
    approval.status ===
    "REJECTED"
  ) {

    console.warn(
      "Blocked rejected recovery from execution."
    );


    showRejectionResult(
      approval
    );


    return;
  }


  show(
    "executionSection"
  );


  const status =
    $("executionStatus");


  if (status) {

    status.innerHTML = `

      <strong>
        Executing approved recovery...
      </strong>

      <span>
        Rerouting shipment and completing
        inventory rebalancing.
      </span>

    `;

  }


  const cards =
    $("executionCards");


  if (cards) {
    cards.innerHTML = "";
  }


  try {

    console.log(
      "RECOVERY EXECUTION REQUEST:",
      approval
    );


    const result =
      await api(
        "/api/pharmaguard/recovery/execute",
        {
          method: "POST",

          body: JSON.stringify({
            approval
          })
        }
      );


    console.log(
      "RECOVERY EXECUTION RESULT:",
      result
    );


    renderExecution(
      result
    );


    showToast(
      "Recovery executed successfully."
    );


  } catch (error) {

    console.error(
      "Recovery execution error:",
      error
    );


    if (status) {

      status.innerHTML = `

        <strong>
          Recovery execution blocked
        </strong>

        <span>
          ${escapeHtml(
            error.message
          )}
        </span>

      `;

    }


    showToast(
      error.message
    );

  }


  const executionSection =
    $("executionSection");


  if (executionSection) {

    executionSection.scrollIntoView({
      behavior: "smooth"
    });

  }
}


// ==================================================
// EXECUTION RESULT
// ==================================================

function renderExecution(
  result
) {

  const status =
    $("executionStatus");


  if (status) {

    status.innerHTML = `

      <strong>
        ✓ Recovery successfully executed
      </strong>

      <span>
        PharmaGuard completed the approved
        recovery workflow.
      </span>

    `;

  }


  const cards =
    $("executionCards");


  if (!cards) {
    return;
  }


  cards.innerHTML = "";


  /*
   * REROUTING RESULT
   */

  const rerouting =
    result.rerouting;


  if (rerouting) {

    cards.innerHTML += `

      <article class="execution-card">

        <h3>
          🚚 REROUTING AGENT
        </h3>

        <div class="execution-value">
          ${escapeHtml(
            rerouting.new_route
          )}
        </div>

        <div class="execution-description">

          Shipment:
          ${escapeHtml(
            rerouting.shipment_id
          )}

          <br>

          ${
            rerouting.original_route
              ? `
                Original route:
                ${escapeHtml(
                  rerouting.original_route
                )}
                <br>
              `
              : ""
          }

          ETA:
          ${escapeHtml(
            rerouting.new_eta_hours
          )}
          hours

          <br>

          Status:
          ${escapeHtml(
            rerouting.shipment_status
          )}

        </div>

      </article>

    `;

  }


  /*
   * INVENTORY RESULTS
   */

  const inventory =
    result.inventory || [];


  inventory.forEach(
    item => {

      const analysis =
        item.analysis || {};

      const transfer =
        item.transfer;


      /*
       * REAL INVENTORY TRANSFER
       */

      if (transfer) {

        cards.innerHTML += `

          <article class="execution-card">

            <h3>
              📦 INVENTORY REBALANCING AGENT
            </h3>

            <div class="execution-value">
              ${escapeHtml(
                transfer.quantity_transferred
              )}
              units transferred
            </div>

            <div class="execution-description">

              Medicine:
              ${escapeHtml(
                item.medicine ||
                transfer.medicine
              )}

              <br>

              Route:
              ${escapeHtml(
                transfer.source
              )}
              →
              ${escapeHtml(
                transfer.destination
              )}

              <br>

              Status:
              ${escapeHtml(
                transfer.status
              )}

              <br>

              Source stock:
              ${escapeHtml(
                transfer.source_new_stock
              )}

              <br>

              Destination stock:
              ${escapeHtml(
                transfer.destination_new_stock
              )}

            </div>

          </article>

        `;

        return;
      }


      /*
       * PG3-P1:
       *
       * If the Inventory Agent recommends
       * zero transfer, clearly show that
       * this is an intentional decision.
       */

      const recommendedTransfer =
        Number(
          analysis.recommended_transfer ?? 0
        );

        const noTransferRequired =
  analysis.status === "SUFFICIENT_STOCK" ||
  recommendedTransfer === 0;

const inventoryDecision =
  noTransferRequired
    ? "No transfer required"
    : `${escapeHtml(
        recommendedTransfer
      )} units recommended`;

const inventoryMessage =
  analysis.message ||
  (
    noTransferRequired
      ? "Destination has sufficient inventory."
      : "Inventory transfer recommended."
  );

cards.innerHTML += `

  <article class="execution-card">

    <h3>
      📦 INVENTORY REBALANCING AGENT
    </h3>

    <div class="execution-value">
      ${inventoryDecision}
    </div>

    <div class="execution-description">

      Medicine:
      ${escapeHtml(
        item.medicine ||
        analysis.medicine
      )}

      <br>

      Destination:
      ${escapeHtml(
        analysis.destination ||
        item.destination ||
        ""
      )}

      <br>

      Current stock:
      ${escapeHtml(
        analysis.current_stock ??
        "—"
      )}

      units

      <br>

      Safety stock:
      ${escapeHtml(
        analysis.safety_stock ??
        "—"
      )}

      units

      <br>

      ${escapeHtml(
        inventoryMessage
      )}

    </div>

  </article>

`;
    }
  );


  /*
   * FALLBACK
   */

  if (
    !rerouting &&
    !inventory.length
  ) {

    cards.innerHTML = `

      <article class="execution-card">

        <h3>
          Recovery Result
        </h3>

        <div class="execution-value">
          ${escapeHtml(
            result.message ||
            "Recovery completed."
          )}
        </div>

      </article>

    `;

  }
}


// ==================================================
// DECISION BUTTON STATE
// ==================================================

function setDecisionButtonsDisabled(
  disabled
) {

  const buttons =
    document.querySelectorAll(
      ".approve-button, .modify-button, .reject-button"
    );


  buttons.forEach(
    button => {

      button.disabled =
        disabled;

      button.style.opacity =
        disabled
          ? "0.65"
          : "1";

      button.style.cursor =
        disabled
          ? "wait"
          : "pointer";

    }
  );
}


// ==================================================
// INITIALIZATION
// ==================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    hide("loadingPanel");
    hide("alertPanel");
    hide("impactSection");
    hide("scenarioSection");
    hide("approvalSection");
    hide("modifySection");
    hide("executionSection");

    const disruptionInput = $("disruptionInput");
    if (disruptionInput) {
      disruptionInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          analyzeDisruption();
        }
      });
    }

    console.log(
      "PharmaGuard Command Center loaded."
    );

  }
);
// ==================================================
// PG4 — NAVIGATION + SHIPMENTS / INVENTORY / NETWORK MAP
// ==================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const main =
      document.querySelector(
        ".main-content"
      );

    const navItems =
      Array.from(
        document.querySelectorAll(
          ".navigation .nav-item"
        )
      );


    if (
      !main ||
      navItems.length < 5
    ) {
      return;
    }


    // ------------------------------------------------
    // COMMAND CENTER CONTAINER
    // Use the pre-built #commandCenterView from HTML.
    // If not found (old HTML), fall back to dynamic.
    // ------------------------------------------------

    let commandCenterView =
      document.getElementById("commandCenterView");

    if (!commandCenterView) {
      commandCenterView =
        document.createElement("div");

      commandCenterView.id =
        "commandCenterView";

      commandCenterView.style.display =
        "contents";

      while (main.firstChild) {
        commandCenterView.appendChild(main.firstChild);
      }

      main.appendChild(commandCenterView);
    } else {
      commandCenterView.style.display = "contents";
    }


    // ------------------------------------------------
    // PG4 PAGE CONTAINER
    // Use the pre-built #pageView from HTML.
    // If not found (old HTML), fall back to dynamic.
    // ------------------------------------------------

    let pageView =
      document.getElementById("pageView");

    if (!pageView) {
      pageView =
        document.createElement("div");

      pageView.id = "pg4PageView";
      pageView.className = "pg4-page-view";
      pageView.style.display = "none";

      main.appendChild(pageView);
    } else {
      pageView.className = "pg4-page-view";
      pageView.style.display = "none";
    }


    // ------------------------------------------------
    // PG4 STYLES
    // ------------------------------------------------

    const pg4Style =
      document.createElement(
        "style"
      );


    pg4Style.textContent = `

      .pg4-page-view {
        width: 100%;
        min-height: 100%;
      }


      .pg4-page-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 24px;
      }


      .pg4-page-header h1 {
        margin: 4px 0 6px;
      }


      .pg4-page-header p {
        margin: 0;
        color: #64748b;
      }


      .pg4-refresh {
        border: 1px solid #d7dee9;
        background: #ffffff;
        color: #1e293b;
        border-radius: 10px;
        padding: 11px 16px;
        font-weight: 700;
        cursor: pointer;
      }


      .pg4-refresh:hover {
        border-color: #2563eb;
        color: #2563eb;
      }


      .pg4-table-card {
        background: #ffffff;
        border: 1px solid #dce3ed;
        border-radius: 14px;
        overflow: hidden;
        box-shadow:
          0 8px 24px
          rgba(
            15,
            23,
            42,
            0.05
          );
      }


      .pg4-table {
        width: 100%;
        border-collapse: collapse;
      }


      .pg4-table th {
        background: #f8fafc;
        color: #64748b;
        font-size: 11px;
        letter-spacing: .08em;
        text-transform: uppercase;
        text-align: left;
        padding: 15px 18px;
        border-bottom:
          1px solid #e2e8f0;
      }


      .pg4-table td {
        padding: 17px 18px;
        border-bottom:
          1px solid #edf1f6;
        color: #334155;
        font-size: 14px;
      }


      .pg4-table tr:last-child td {
        border-bottom: 0;
      }


      .pg4-id {
        font-weight: 800;
        color: #172033;
      }


      .pg4-medicine {
        font-weight: 700;
        color: #172033;
      }


      .pg4-route {
        color: #475569;
        white-space: nowrap;
      }


      .pg4-badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 5px 10px;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .04em;
      }


      .pg4-badge-critical {
        background: #fee2e2;
        color: #b91c1c;
      }


      .pg4-badge-high {
        background: #ffedd5;
        color: #c2410c;
      }


      .pg4-badge-medium {
        background: #fef3c7;
        color: #a16207;
      }


      .pg4-badge-healthy {
        background: #dcfce7;
        color: #15803d;
      }


      .pg4-badge-watch {
        background: #fef3c7;
        color: #a16207;
      }


      .pg4-summary-grid {
        display: grid;
        grid-template-columns:
          repeat(
            3,
            minmax(0, 1fr)
          );
        gap: 14px;
        margin-bottom: 18px;
      }


      .pg4-summary-card {
        background: #ffffff;
        border: 1px solid #dce3ed;
        border-radius: 14px;
        padding: 18px;
      }


      .pg4-summary-label {
        color: #64748b;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
      }


      .pg4-summary-value {
        margin-top: 6px;
        color: #172033;
        font-size: 25px;
        font-weight: 800;
      }


      .pg4-empty,
      .pg4-loading,
      .pg4-error {
        padding: 42px 24px;
        text-align: center;
        color: #64748b;
      }


      .pg4-error {
        color: #b91c1c;
      }

      /* Network Map Specific */
      .nm-wrapper { background: #fff; border: 1px solid #dce3ed; border-radius: 14px; overflow: hidden; }
      .nm-status-bar { padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: #475569; }
      .nm-live-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; }
      .nm-map-container { height: 500px; width: 100%; z-index: 1; }
      .nm-legend { padding: 12px; display: flex; gap: 16px; font-size: 12px; color: #64748b; }
      .nm-legend-item { display: flex; align-items: center; gap: 6px; }
      .nm-legend-dot { width: 10px; height: 10px; border-radius: 50%; }
      .nm-dot-critical { background: #dc2626; }
      .nm-dot-high { background: #ea580c; }
      .nm-dot-medium { background: #ca8a04; }
      .nm-dot-rerouted { background: #7c3aed; }


      @media (max-width: 900px) {

        .pg4-page-header {
          align-items: flex-start;
          flex-direction: column;
        }


        .pg4-summary-grid {
          grid-template-columns: 1fr;
        }


        .pg4-table-card {
          overflow-x: auto;
        }


        .pg4-table {
          min-width: 850px;
        }

      }

    `;


    document.head.appendChild(
      pg4Style
    );


    // ------------------------------------------------
    // NAVIGATION
    // ------------------------------------------------

    function setActiveNav(
      index
    ) {

      navItems.forEach(
        (
          item,
          itemIndex
        ) => {

          item.classList.toggle(
            "active",
            itemIndex === index
          );

        }
      );

    }


    // ------------------------------------------------
    // COMMAND CENTER
    // ------------------------------------------------

    function showCommandCenter() {

      commandCenterView.style.display =
        "contents";

      pageView.style.display =
        "none";

      setActiveNav(0);

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      // Clean up map if active
      if (window._pgMapCleanup) {
        window._pgMapCleanup();
      }

    }


    // ------------------------------------------------
    // BADGES
    // ------------------------------------------------

    function badgeClass(
      value
    ) {

      const normalized =
        String(
          value || ""
        )
          .toLowerCase()
          .replace(
            /[^a-z]/g,
            ""
          );


      if (
        normalized ===
        "critical"
      ) {

        return "pg4-badge-critical";

      }


      if (
        normalized ===
        "high"
      ) {

        return "pg4-badge-high";

      }


      if (
        normalized ===
        "medium"
      ) {

        return "pg4-badge-medium";

      }


      if (
        normalized ===
        "healthy"
      ) {

        return "pg4-badge-healthy";

      }


      return "pg4-badge-watch";

    }


    // ------------------------------------------------
    // PAGE SHELL
    // ------------------------------------------------

    function renderPageShell(
      kicker,
      title,
      description,
      content
    ) {

      pageView.innerHTML = `

        <div
          class="pg4-page-header"
        >

          <div>

            <div
              class="section-kicker"
            >
              ${escapeHtml(
                kicker
              )}
            </div>

            <h1>
              ${escapeHtml(
                title
              )}
            </h1>

            <p>
              ${escapeHtml(
                description
              )}
            </p>

          </div>


          <button
            type="button"
            class="pg4-refresh"
            id="pg4RefreshButton"
          >
            Refresh Data
          </button>

        </div>

        ${content}

      `;


      const refreshButton =
        $("pg4RefreshButton");


      if (
        refreshButton
      ) {

        refreshButton.addEventListener(
          "click",
          () => {

            if (
              title ===
              "Shipments"
            ) {

              loadShipments();

            } else if (
              title ===
              "Network Map"
            ) {

              showNetworkMap();

            } else {

              loadInventory();

            }

          }
        );

      }

    }


    // ------------------------------------------------
    // SHIPMENTS
    // ------------------------------------------------

    async function loadShipments() {

      setActiveNav(1);

      commandCenterView.style.display =
        "none";

      pageView.style.display =
        "block";

      // Clean up map if active
      if (window._pgMapCleanup) {
        window._pgMapCleanup();
      }


      renderPageShell(
        "FLEET OPERATIONS",
        "Shipments",
        "Live shipment visibility across the pharmaceutical supply network.",
        `
          <div
            class="pg4-table-card"
          >
            <div
              class="pg4-loading"
            >
              Loading shipment data...
            </div>
          </div>
        `
      );


      try {

        const result =
          await api(
            "/api/shipments"
          );


        const shipments =
          Array.isArray(
            result.shipments
          )
            ? result.shipments
            : [];


        const critical =
          shipments.filter(
            shipment =>
              String(
                shipment.priority
              ).toLowerCase() ===
              "critical"
          ).length;


        const inTransit =
          shipments.filter(
            shipment =>
              String(
                shipment.status
              ).toLowerCase() ===
              "in transit"
          ).length;


        renderPageShell(
          "FLEET OPERATIONS",
          "Shipments",
          "Live shipment visibility across the pharmaceutical supply network.",
          `

            <div
              class="pg4-summary-grid"
            >

              <div
                class="pg4-summary-card"
              >

                <div
                  class="pg4-summary-label"
                >
                  Total Shipments
                </div>

                <div
                  class="pg4-summary-value"
                >
                  ${shipments.length}
                </div>

              </div>


              <div
                class="pg4-summary-card"
              >

                <div
                  class="pg4-summary-label"
                >
                  Critical Priority
                </div>

                <div
                  class="pg4-summary-value"
                >
                  ${critical}
                </div>

              </div>


              <div
                class="pg4-summary-card"
              >

                <div
                  class="pg4-summary-label"
                >
                  In Transit
                </div>

                <div
                  class="pg4-summary-value"
                >
                  ${inTransit}
                </div>

              </div>

            </div>


            <div
              class="pg4-table-card"
            >

              ${
                shipments.length
                  ? `

                    <table
                      class="pg4-table"
                    >

                      <thead>

                        <tr>

                          <th>
                            ID
                          </th>

                          <th>
                            Medicine
                          </th>

                          <th>
                            Priority
                          </th>

                          <th>
                            Route
                          </th>

                          <th>
                            Origin
                          </th>

                          <th>
                            Destination
                          </th>

                          <th>
                            Status
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        ${shipments
                          .map(
                            shipment => `

                              <tr>

                                <td
                                  class="pg4-id"
                                >
                                  ${escapeHtml(
                                    shipment.id
                                  )}
                                </td>


                                <td
                                  class="pg4-medicine"
                                >
                                  ${escapeHtml(
                                    shipment.medicine
                                  )}
                                </td>


                                <td>

                                  <span
                                    class="
                                      pg4-badge
                                      ${badgeClass(
                                        shipment.priority
                                      )}
                                    "
                                  >
                                    ${escapeHtml(
                                      shipment.priority
                                    )}
                                  </span>

                                </td>


                                <td
                                  class="pg4-route"
                                >
                                  ${escapeHtml(
                                    shipment.route
                                  )}
                                </td>


                                <td>
                                  ${escapeHtml(
                                    shipment.origin
                                  )}
                                </td>


                                <td>
                                  ${escapeHtml(
                                    shipment.destination
                                  )}
                                </td>


                                <td>
                                  ${escapeHtml(
                                    shipment.status
                                  )}
                                </td>

                              </tr>

                            `
                          )
                          .join("")}

                      </tbody>

                    </table>

                  `
                  : `

                    <div
                      class="pg4-empty"
                    >
                      No shipment records available.
                    </div>

                  `
              }

            </div>

          `
        );

      } catch (
        error
      ) {

        renderPageShell(
          "FLEET OPERATIONS",
          "Shipments",
          "Live shipment visibility across the pharmaceutical supply network.",
          `

            <div
              class="pg4-table-card"
            >

              <div
                class="pg4-error"
              >

                Unable to load
                shipment data:

                ${escapeHtml(
                  error.message
                )}

              </div>

            </div>

          `
        );

      }

    }


    // ------------------------------------------------
    // NETWORK MAP
    // ------------------------------------------------

    function showNetworkMap() {

      setActiveNav(2);

      commandCenterView.style.display =
        "none";

      pageView.style.display =
        "block";

      // Clean up any previous map instance
      if (window._pgMapCleanup) {
        window._pgMapCleanup();
        window._pgMapCleanup = null;
      }

      renderPageShell(
        "SIMULATED LIVE TRACKING",
        "Network Map",
        "Real-time pharmaceutical supply routes with initial/final destinations, state mega-warehouses, and live vehicle tracking.",
        `
          <div class="nm-wrapper">
            <div class="nm-status-bar">
              <span class="nm-live-dot"></span>
              <span class="nm-live-label">LIVE PHARMA FLEET TRACKING</span>
              <div class="nm-toolbar">
                <button type="button" id="nmToggleHubsBtn" class="nm-toggle-btn active">
                  🏢 State Mega-Hubs (19)
                </button>
                <span class="nm-last-update" id="nmLastUpdate">Connecting...</span>
              </div>
            </div>
            <div id="nmMapContainer" class="nm-map-container"></div>
            <div class="nm-legend">
              <div class="nm-legend-item">
                <span class="nm-legend-dot nm-dot-origin"></span> 🟢 Origin Hub
              </div>
              <div class="nm-legend-item">
                <span class="nm-legend-dot nm-dot-dest"></span> 🏁 Destination Depot
              </div>
              <div class="nm-legend-item">
                <span class="nm-legend-dot nm-dot-hub"></span> 🏢 State Mega-Warehouse
              </div>
              <div class="nm-legend-item" style="gap:4px;">
                <span style="display:inline-block;width:18px;height:3px;background:#2563eb;border-radius:2px;"></span> Active Route
              </div>
              <div class="nm-legend-item" style="gap:4px;">
                <span style="display:inline-block;width:18px;height:3px;background:#7c3aed;border-radius:2px;"></span> Rerouted Detour
              </div>
              <div class="nm-legend-item">
                <span class="nm-legend-dot nm-dot-critical"></span> Critical
              </div>
              <div class="nm-legend-item">
                <span class="nm-legend-dot nm-dot-high"></span> High
              </div>
              <div class="nm-legend-item">
                <span class="nm-legend-dot nm-dot-medium"></span> Medium
              </div>
            </div>
          </div>
        `
      );

      // Hide the Refresh Data button for map view
      const refreshBtn = $("pg4RefreshButton");
      if (refreshBtn) {
        refreshBtn.style.display = "none";
      }

      initNetworkMap();

    }


    function initNetworkMap(attempt = 0) {

      // Guard: Leaflet must be loaded
      if (typeof L === "undefined") {
        const container = document.getElementById("nmMapContainer");
        if (container && attempt === 0) {
          container.innerHTML =
            '<div class="pg4-loading" style="padding:60px 20px; text-align:center; color:#64748b;">Initializing live map network...</div>';
        }

        if (attempt < 25) {
          setTimeout(() => {
            initNetworkMap(attempt + 1);
          }, 120);
          return;
        }

        if (container) {
          container.innerHTML =
            '<div class="pg4-error" style="padding:40px;">Map library unavailable. The rest of PharmaGuard continues to work normally.</div>';
        }
        return;
      }

      const mapEl = document.getElementById("nmMapContainer");
      if (!mapEl) return;
      mapEl.innerHTML = "";

      // India center view
      const map = L.map(mapEl, {
        center: [22.8, 79.5],
        zoom: 5,
        zoomControl: true
      });

      // OpenStreetMap tiles
      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18
        }
      ).addTo(map);

      // Layers groups for clean toggle management
      const routeLinesGroup = L.layerGroup().addTo(map);
      const endpointMarkersGroup = L.layerGroup().addTo(map);
      const stateHubsGroup = L.layerGroup().addTo(map);
      const vehicleMarkersGroup = L.layerGroup().addTo(map);

      let showStateHubs = true;
      const toggleHubsBtn = document.getElementById("nmToggleHubsBtn");
      if (toggleHubsBtn) {
        toggleHubsBtn.addEventListener("click", () => {
          showStateHubs = !showStateHubs;
          if (showStateHubs) {
            map.addLayer(stateHubsGroup);
            toggleHubsBtn.classList.add("active");
          } else {
            map.removeLayer(stateHubsGroup);
            toggleHubsBtn.classList.remove("active");
          }
        });
      }

      function markerColor(priority, status) {
        if (status && String(status).toLowerCase() === "rerouted") {
          return "#7c3aed"; // purple
        }
        const p = String(priority || "").toLowerCase();
        if (p === "critical") return "#dc2626"; // red
        if (p === "high")     return "#ea580c"; // orange
        return "#ca8a04"; // yellow/gold
      }

      // 1. Vehicle moving marker icon
      function createVehicleIcon(priority, status, medicine) {
        const color = markerColor(priority, status);
        return L.divIcon({
          className: "",
          html: `
            <div class="nm-vehicle-pin" style="
              width: 32px; height: 32px;
              background: ${color};
              box-shadow: 0 3px 12px rgba(0,0,0,0.45);
              border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              color: #ffffff; font-size: 15px; cursor: pointer;
            ">
              🚚
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18]
        });
      }

      // 2. Initial Origin Point Icon
      function createOriginIcon() {
        return L.divIcon({
          className: "",
          html: `
            <div class="nm-pin nm-origin-pin" style="
              width: 28px; height: 28px;
              display: flex; align-items: center; justify-content: center;
              font-size: 14px; cursor: pointer;
            ">
              🟢
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -16]
        });
      }

      // 3. Final Destination Point Icon
      function createDestinationIcon() {
        return L.divIcon({
          className: "",
          html: `
            <div class="nm-pin nm-dest-pin" style="
              width: 28px; height: 28px;
              display: flex; align-items: center; justify-content: center;
              font-size: 14px; cursor: pointer;
            ">
              🏁
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -16]
        });
      }

      // 4. State Mega-Warehouse Hub Icon
      function createHubIcon() {
        return L.divIcon({
          className: "",
          html: `
            <div class="nm-pin nm-hub-pin" style="
              width: 24px; height: 24px;
              display: flex; align-items: center; justify-content: center;
              font-size: 12px; cursor: pointer; opacity: 0.9;
            ">
              🏢
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -14]
        });
      }

      const vehicleMarkers = {};
      const routePolylines = {};
      const endpointMarkers = {};
      let lastUpdateTime = null;
      let socket = null;
      let lastUpdateInterval = null;

      // Popups formatting
      function formatVehiclePopup(t) {
        const eta = t.eta_hours != null ? `${t.eta_hours}h` : "—";
        const statusLabel = t.status || "In Transit";
        const color = markerColor(t.priority, t.status);
        return `
          <div style="min-width:240px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <span style="font-weight:800;font-size:15px;color:#1e293b;">${escapeHtml(t.shipment_id)}</span>
              <span style="background:${color};color:#fff;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;">
                ${escapeHtml(t.priority || "")}
              </span>
            </div>
            <div style="font-size:13px;font-weight:700;color:#0f5bd3;margin-bottom:4px;">
              💊 ${escapeHtml(t.medicine || "Life-Saving Medicine")}
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;margin:8px 0;font-size:12px;">
              <div style="color:#64748b;font-size:10px;text-transform:uppercase;font-weight:700;">Active Route Path</div>
              <div style="font-weight:700;color:#1e293b;margin-top:2px;">${escapeHtml(t.route || "")}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;margin-bottom:6px;">
              <div>Status: <strong>${escapeHtml(statusLabel)}</strong></div>
              <div>Speed: <strong>${t.speed || 70} km/h</strong></div>
              <div>ETA: <strong>${eta}</strong></div>
              <div>Heading: <strong>${t.heading || 0}°</strong></div>
            </div>
            <div style="font-size:11px;color:#64748b;border-top:1px solid #edf2f7;padding-top:6px;">
              <div>🟢 <strong>Origin:</strong> ${escapeHtml(t.origin_hub || t.origin || "Origin")}</div>
              <div>🏁 <strong>Destination:</strong> ${escapeHtml(t.destination_hub || t.destination || "Destination")}</div>
            </div>
          </div>
        `;
      }

      function formatOriginPopup(t) {
        return `
          <div style="min-width:230px;">
            <div style="background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:800;text-transform:uppercase;margin-bottom:6px;">
              🟢 Initial Origin Dispatch Hub
            </div>
            <div style="font-weight:800;font-size:14px;color:#1e293b;margin-bottom:2px;">
              ${escapeHtml(t.origin_hub || `${t.origin} Central Logistics Hub`)}
            </div>
            <div style="font-size:12px;color:#475569;margin-bottom:6px;">
              🏢 ${escapeHtml(t.origin_warehouse || `${t.origin} Central Pharma Warehouse`)}
            </div>
            <div style="font-size:11px;color:#64748b;border-top:1px solid #edf2f7;padding-top:6px;">
              <div>Departing Shipment: <strong>${escapeHtml(t.shipment_id)}</strong></div>
              <div>Cargo: <strong>${escapeHtml(t.medicine)}</strong> (${escapeHtml(t.priority)})</div>
            </div>
          </div>
        `;
      }

      function formatDestinationPopup(t) {
        return `
          <div style="min-width:230px;">
            <div style="background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:800;text-transform:uppercase;margin-bottom:6px;">
              🏁 Final Destination Medical Depot
            </div>
            <div style="font-weight:800;font-size:14px;color:#1e293b;margin-bottom:2px;">
              ${escapeHtml(t.destination_hub || `${t.destination} Regional Health Hub`)}
            </div>
            <div style="font-size:12px;color:#475569;margin-bottom:6px;">
              🏥 ${escapeHtml(t.destination_warehouse || `${t.destination} State Buffer Store`)}
            </div>
            <div style="font-size:11px;color:#64748b;border-top:1px solid #edf2f7;padding-top:6px;">
              <div>Incoming Shipment: <strong>${escapeHtml(t.shipment_id)}</strong></div>
              <div>Medicine Expected: <strong>${escapeHtml(t.medicine)}</strong></div>
              <div>Estimated Arrival: <strong>${t.eta_hours != null ? `${t.eta_hours} hours` : "In Transit"}</strong></div>
            </div>
          </div>
        `;
      }

      function formatWarehousePopup(wh) {
        return `
          <div style="min-width:240px;">
            <div style="background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:800;text-transform:uppercase;margin-bottom:6px;">
              🏢 State Strategic Mega-Warehouse
            </div>
            <div style="font-weight:800;font-size:14px;color:#1e293b;margin-bottom:2px;">
              ${escapeHtml(wh.hub_name)}
            </div>
            <div style="font-size:12px;font-weight:700;color:#0f5bd3;margin-bottom:4px;">
              ${escapeHtml(wh.warehouse_name)}
            </div>
            <div style="font-size:11px;color:#475569;margin-bottom:6px;">
              📍 ${escapeHtml(wh.location_address)}
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:6px 8px;font-size:11px;color:#334155;">
              <div>State: <strong>${escapeHtml(wh.state)}</strong></div>
              <div>Capacity: <strong>${escapeHtml(wh.capacity)}</strong></div>
              <div>Temp Control: <strong>${escapeHtml(wh.cold_storage_temp)}</strong></div>
              <div>Status: <strong style="color:#16a34a;">${escapeHtml(wh.status)}</strong></div>
            </div>
          </div>
        `;
      }

      // Draw Zomato-style route polyline between Origin and Destination
      function drawOrUpdateRouteLine(t) {
        const waypoints = t.waypoints || [];
        if (waypoints.length < 2) return;

        const isRerouted = t.status && String(t.status).toLowerCase() === "rerouted";
        const primaryColor = isRerouted ? "#7c3aed" : "#2563eb";
        const casingColor = isRerouted ? "rgba(124, 58, 237, 0.25)" : "rgba(37, 99, 235, 0.22)";

        // Remove existing route lines for this shipment if already drawn
        if (routePolylines[t.shipment_id]) {
          routeLinesGroup.removeLayer(routePolylines[t.shipment_id].casing);
          routeLinesGroup.removeLayer(routePolylines[t.shipment_id].line);
        }

        // 1. Casing polyline (soft glowing border)
        const casing = L.polyline(waypoints, {
          color: casingColor,
          weight: 8,
          opacity: 0.85,
          lineCap: "round",
          lineJoin: "round"
        }).addTo(routeLinesGroup);

        // 2. Main delivery route polyline (crisp dashed line like Zomato/Swiggy tracking)
        const line = L.polyline(waypoints, {
          color: primaryColor,
          weight: 3.5,
          opacity: 0.95,
          dashArray: "6, 8",
          lineCap: "round",
          lineJoin: "round"
        }).addTo(routeLinesGroup);

        line.bindTooltip(
          `<strong>${escapeHtml(t.shipment_id)} Route</strong>: ${escapeHtml(t.route || "")}`,
          { sticky: true, className: "nm-route-tooltip" }
        );

        routePolylines[t.shipment_id] = { casing, line, currentRoute: t.route };
      }

      // Draw Origin and Destination endpoints
      function drawEndpoints(t) {
        const originCoords = t.origin_coords;
        const destCoords = t.destination_coords;

        const originKey = `${t.shipment_id}-origin`;
        const destKey = `${t.shipment_id}-dest`;

        if (originCoords && !endpointMarkers[originKey]) {
          const originMarker = L.marker(originCoords, { icon: createOriginIcon() })
            .addTo(endpointMarkersGroup)
            .bindPopup(formatOriginPopup(t), { maxWidth: 280 });
          endpointMarkers[originKey] = originMarker;
        }

        if (destCoords && !endpointMarkers[destKey]) {
          const destMarker = L.marker(destCoords, { icon: createDestinationIcon() })
            .addTo(endpointMarkersGroup)
            .bindPopup(formatDestinationPopup(t), { maxWidth: 280 });
          endpointMarkers[destKey] = destMarker;
        }
      }

      // Update vehicle marker on map
      function placeOrMoveVehicle(t) {
        if (!t.latitude || !t.longitude) return;
        const latlng = [t.latitude, t.longitude];

        // Draw/update Zomato-style route path line
        drawOrUpdateRouteLine(t);

        // Draw initial & final destination pins
        drawEndpoints(t);

        if (vehicleMarkers[t.shipment_id]) {
          vehicleMarkers[t.shipment_id].setLatLng(latlng);
          vehicleMarkers[t.shipment_id].setIcon(createVehicleIcon(t.priority, t.status, t.medicine));
          if (vehicleMarkers[t.shipment_id].getPopup()) {
            vehicleMarkers[t.shipment_id].getPopup().setContent(formatVehiclePopup(t));
          }
        } else {
          const m = L.marker(latlng, {
            icon: createVehicleIcon(t.priority, t.status, t.medicine)
          })
            .addTo(vehicleMarkersGroup)
            .bindPopup(formatVehiclePopup(t), { maxWidth: 280 });

          vehicleMarkers[t.shipment_id] = m;
        }
      }

      // Render State Mega-Warehouses layer
      function renderStateWarehouses(warehousesList) {
        (warehousesList || []).forEach(wh => {
          if (!wh.lat || !wh.lng) return;
          L.marker([wh.lat, wh.lng], { icon: createHubIcon() })
            .addTo(stateHubsGroup)
            .bindPopup(formatWarehousePopup(wh), { maxWidth: 280 });
        });
      }

      function updateLastUpdateDisplay() {
        const el = document.getElementById("nmLastUpdate");
        if (!el || !lastUpdateTime) return;
        const secAgo = Math.round((Date.now() - lastUpdateTime) / 1000);
        el.textContent = `Last update: ${secAgo}s ago`;
      }

      // Initial paint from REST API
      api("/api/tracking/all")
        .then(result => {
          // Render State Mega-Warehouses across India
          if (result.warehouses && Array.isArray(result.warehouses)) {
            renderStateWarehouses(result.warehouses);
          }

          // Render active shipments with Zomato route paths
          const list = result.tracking || [];
          list.forEach(placeOrMoveVehicle);

          if (list.length > 0) {
            const allPoints = [];
            list.forEach(t => {
              if (t.latitude && t.longitude) allPoints.push([t.latitude, t.longitude]);
              if (t.origin_coords) allPoints.push(t.origin_coords);
              if (t.destination_coords) allPoints.push(t.destination_coords);
            });

            if (allPoints.length > 0) {
              map.fitBounds(allPoints, { padding: [50, 50] });
            }
          }
        })
        .catch(() => {
          // Non-fatal
        });

      // Connect Socket.IO for live position updates
      try {
        socket = io({
          transports: ["websocket", "polling"]
        });

        socket.on("connect", () => {
          const el = document.getElementById("nmLastUpdate");
          if (el) el.textContent = "Live Socket.IO Stream Active";
        });

        socket.on("trackingUpdate", (trackingList) => {
          lastUpdateTime = Date.now();
          trackingList.forEach(placeOrMoveVehicle);
          updateLastUpdateDisplay();
        });

        socket.on("connect_error", () => {
          const el = document.getElementById("nmLastUpdate");
          if (el) el.textContent = "Live updates unavailable — showing last known positions.";
        });

      } catch (e) {
        const el = document.getElementById("nmLastUpdate");
        if (el) el.textContent = "Live updates unavailable.";
      }

      // Update "X sec ago" display every second
      lastUpdateInterval = setInterval(updateLastUpdateDisplay, 1000);

      // Cleanup — called when leaving Network Map page
      window._pgMapCleanup = function() {
        if (socket) {
          socket.disconnect();
          socket = null;
        }
        if (lastUpdateInterval) {
          clearInterval(lastUpdateInterval);
          lastUpdateInterval = null;
        }
        try {
          map.remove();
        } catch (e) {}
        window._pgMapCleanup = null;
      };

    }



    // ------------------------------------------------
    // INVENTORY
    // ------------------------------------------------

    async function loadInventory() {

      setActiveNav(3);

      commandCenterView.style.display =
        "none";

      pageView.style.display =
        "block";

      // Clean up map if active
      if (window._pgMapCleanup) {
        window._pgMapCleanup();
      }


      renderPageShell(
        "STOCK CONTROL",
        "Inventory",
        "Medicine stock position and safety-buffer visibility by location.",
        `
          <div
            class="pg4-table-card"
          >

            <div
              class="pg4-loading"
            >
              Loading inventory data...
            </div>

          </div>
        `
      );


      try {

        const result =
          await api(
            "/api/inventory/all"
          );


        const inventory =
          Array.isArray(
            result.inventory
          )
            ? result.inventory
            : [];


        const healthy =
          inventory.filter(
            item =>
              Number(
                item.current_stock
              ) >
              Number(
                item.safety_stock
              )
          ).length;


        const belowSafety =
          inventory.length -
          healthy;


        renderPageShell(
          "STOCK CONTROL",
          "Inventory",
          "Medicine stock position and safety-buffer visibility by location.",
          `

            <div
              class="pg4-summary-grid"
            >

              <div
                class="pg4-summary-card"
              >

                <div
                  class="pg4-summary-label"
                >
                  Inventory Records
                </div>

                <div
                  class="pg4-summary-value"
                >
                  ${inventory.length}
                </div>

              </div>


              <div
                class="pg4-summary-card"
              >

                <div
                  class="pg4-summary-label"
                >
                  Above Safety Stock
                </div>

                <div
                  class="pg4-summary-value"
                >
                  ${healthy}
                </div>

              </div>


              <div
                class="pg4-summary-card"
              >

                <div
                  class="pg4-summary-label"
                >
                  At / Below Safety
                </div>

                <div
                  class="pg4-summary-value"
                >
                  ${belowSafety}
                </div>

              </div>

            </div>


            <div
              class="pg4-table-card"
            >

              ${
                inventory.length
                  ? `

                    <table
                      class="pg4-table"
                    >

                      <thead>

                        <tr>

                          <th>
                            Location
                          </th>

                          <th>
                            Medicine
                          </th>

                          <th>
                            Current Stock
                          </th>

                          <th>
                            Safety Stock
                          </th>

                          <th>
                            Daily Demand
                          </th>

                          <th>
                            Coverage
                          </th>

                          <th>
                            Status
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        ${inventory
                          .map(
                            item => {

                              const current =
                                Number(
                                  item.current_stock
                                ) || 0;


                              const safety =
                                Number(
                                  item.safety_stock
                                ) || 0;


                              const demand =
                                Number(
                                  item.daily_demand
                                ) || 0;


                              const coverage =
                                demand > 0
                                  ? (
                                      current /
                                      demand
                                    ).toFixed(1)
                                  : "—";


                              const healthyStock =
                                current >
                                safety;


                              const status =
                                healthyStock
                                  ? "Healthy"
                                  : "Watch";


                              return `

                                <tr>

                                  <td
                                    class="pg4-id"
                                  >
                                    ${escapeHtml(
                                      item.location
                                    )}
                                  </td>


                                  <td
                                    class="pg4-medicine"
                                  >
                                    ${escapeHtml(
                                      item.medicine
                                    )}
                                  </td>


                                  <td>
                                    ${current}
                                    units
                                  </td>


                                  <td>
                                    ${safety}
                                    units
                                  </td>


                                  <td>
                                    ${demand}
                                    units/day
                                  </td>


                                  <td>
                                    ${
                                      coverage ===
                                      "—"
                                        ? "—"
                                        : `${coverage} days`
                                    }
                                  </td>


                                  <td>

                                    <span
                                      class="
                                        pg4-badge
                                        ${
                                          healthyStock
                                            ? "pg4-badge-healthy"
                                            : "pg4-badge-watch"
                                        }
                                      "
                                    >
                                      ${status}
                                    </span>

                                  </td>

                                </tr>

                              `;

                            }
                          )
                          .join("")}

                      </tbody>

                    </table>

                  `
                  : `

                    <div
                      class="pg4-empty"
                    >
                      No inventory records available.
                    </div>

                  `
              }

            </div>

          `
        );

      } catch (
        error
      ) {

        renderPageShell(
          "STOCK CONTROL",
          "Inventory",
          "Medicine stock position and safety-buffer visibility by location.",
          `

            <div
              class="pg4-table-card"
            >

              <div
                class="pg4-error"
              >

                Unable to load
                inventory data:

                ${escapeHtml(
                  error.message
                )}

              </div>

            </div>

          `
        );

      }

    }


    // ------------------------------------------------
    // RECOVERY HISTORY — TEMPORARY
    // ------------------------------------------------

    function showRecoveryHistory() {

      setActiveNav(4);

      commandCenterView.style.display =
        "none";

      pageView.style.display =
        "block";

      // Clean up map if active
      if (window._pgMapCleanup) {
        window._pgMapCleanup();
      }


      renderPageShell(
        "RECOVERY OPERATIONS",
        "Recovery History",
        "Review completed human decisions and recovery executions.",
        `

          <div
            class="pg4-table-card"
          >

            <div
              class="pg4-empty"
            >

              Recovery History
              integration will be
              completed in the next
              hardening phase.

            </div>

          </div>

        `
      );

    }


    // ------------------------------------------------
    // MEDICINE MASTER DATABASE
    // ------------------------------------------------

    async function loadMedicineMaster() {

      setActiveNav(5);

      commandCenterView.style.display =
        "none";

      pageView.style.display =
        "block";

      // Clean up map if active
      if (window._pgMapCleanup) {
        window._pgMapCleanup();
        window._pgMapCleanup = null;
      }

      try {

        const result =
          await api("/api/medicines");

        const list =
          result.medicines || [];

        renderPageShell(
          "CLINICAL PHARMACOPEIA",
          "Medicine Master Database",
          "FDA & RxNorm aligned clinical monographs, cold-chain thermal excursion tolerances, and bio-equivalent generic substitutes.",
          `
            <div class="pg4-table-card">

              <div style="padding:16px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
                <div>
                  <div style="font-weight:800;font-size:14px;color:#1e293b;">Active Formulations & Clinical Monograph Catalog</div>
                  <div style="font-size:12px;color:#64748b;margin-top:2px;">Thermal stability tracking, FEFO batch guidelines, and substitution mapping</div>
                </div>
                <div style="display:flex;gap:8px;font-size:11px;font-weight:700;">
                  <span style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;padding:3px 8px;border-radius:6px;">Tier 1: Life-Critical</span>
                  <span style="background:#fff7ed;color:#c2410c;border:1px solid #ffedd5;padding:3px 8px;border-radius:6px;">Tier 2: Urgent</span>
                  <span style="background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;padding:3px 8px;border-radius:6px;">Tier 3: Standard</span>
                </div>
              </div>

              ${
                list.length > 0
                  ? `
                    <table class="pg4-table">
                      <thead>
                        <tr>
                          <th>Drug Code & Formulation</th>
                          <th>Category & Clinical Indication</th>
                          <th>Criticality Tier</th>
                          <th>Storage & Thermal Limit</th>
                          <th>Approved Generic Substitutes</th>
                          <th>Regulatory Schedule</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${list
                          .map((med) => {
                            const tierColor =
                              med.criticality_tier === "TIER_1_LIFE_CRITICAL"
                                ? "#b91c1c"
                                : med.criticality_tier === "TIER_2_URGENT"
                                ? "#ea580c"
                                : "#15803d";
                            const tierBg =
                              med.criticality_tier === "TIER_1_LIFE_CRITICAL"
                                ? "#fef2f2"
                                : med.criticality_tier === "TIER_2_URGENT"
                                ? "#fff7ed"
                                : "#f0fdf4";
                            const tierLabel =
                              med.criticality_tier === "TIER_1_LIFE_CRITICAL"
                                ? "Tier 1: Life-Critical"
                                : med.criticality_tier === "TIER_2_URGENT"
                                ? "Tier 2: Urgent"
                                : "Tier 3: Standard";
                            const isCold =
                              med.temp_range_c && med.temp_range_c[0] <= 8;

                            return `
                              <tr>
                                <td>
                                  <div style="font-weight:800;color:#0f5bd3;font-size:13px;">
                                    ${escapeHtml(med.name)}
                                  </div>
                                  <div style="font-size:11px;color:#64748b;margin-top:2px;">
                                    <code>${escapeHtml(med.id)}</code> • Brands: <em>${escapeHtml((med.brand_names || []).join(", "))}</em>
                                  </div>
                                </td>
                                <td>
                                  <div style="font-weight:600;font-size:12px;color:#1e293b;">
                                    ${escapeHtml(med.category)}
                                  </div>
                                  <div style="font-size:11px;color:#64748b;margin-top:2px;">
                                    ${escapeHtml(med.clinical_indication)}
                                  </div>
                                </td>
                                <td>
                                  <span style="background:${tierBg};color:${tierColor};border:1px solid ${tierColor}33;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:800;white-space:nowrap;">
                                    ${escapeHtml(tierLabel)}
                                  </span>
                                </td>
                                <td>
                                  <div style="font-weight:700;font-size:12px;color:${isCold ? "#0f5bd3" : "#334155"};">
                                    ${isCold ? "❄️ " : "📦 "}${escapeHtml(med.storage_condition)}
                                  </div>
                                  <div style="font-size:11px;color:${isCold ? "#b91c1c" : "#64748b"};font-weight:600;margin-top:2px;">
                                    Max Excursion: <strong>${med.max_unrefrigerated_hours} hours</strong>
                                  </div>
                                </td>
                                <td>
                                  <div style="font-size:11px;line-height:1.4;">
                                    ${(med.approved_substitutes || [])
                                      .map((s) => `<div style="color:#0369a1;">• ${escapeHtml(s)}</div>`)
                                      .join("")}
                                  </div>
                                </td>
                                <td>
                                  <div style="font-size:11px;color:#334155;font-weight:600;">
                                    ${escapeHtml(med.regulatory_schedule)}
                                  </div>
                                  <div style="font-size:10px;color:#64748b;margin-top:2px;">
                                    Shelf Life: ${med.shelf_life_months} mos
                                  </div>
                                </td>
                              </tr>
                            `;
                          })
                          .join("")}
                      </tbody>
                    </table>
                  `
                  : `
                    <div class="pg4-empty">
                      No medicine master records available.
                    </div>
                  `
              }

            </div>
          `
        );

      } catch (error) {

        renderPageShell(
          "CLINICAL PHARMACOPEIA",
          "Medicine Master Database",
          "Clinical monographs and cold-chain stability records.",
          `
            <div class="pg4-table-card">
              <div class="pg4-error">
                Unable to load medicine master: ${escapeHtml(error.message)}
              </div>
            </div>
          `
        );

      }

    }


    // ------------------------------------------------
    // NAVIGATION EVENTS
    // navItems[0] = Command Center
    // navItems[1] = Shipments
    // navItems[2] = Network Map
    // navItems[3] = Inventory
    // navItems[4] = Recovery History
    // navItems[5] = Medicine Master
    // ------------------------------------------------

    navItems[0]
      .addEventListener(
        "click",
        showCommandCenter
      );


    navItems[1]
      .addEventListener(
        "click",
        loadShipments
      );


    if (navItems[2]) {
      navItems[2]
        .addEventListener(
          "click",
          showNetworkMap
        );
    }


    if (navItems[3]) {
      navItems[3]
        .addEventListener(
          "click",
          loadInventory
        );
    }


    if (navItems[4]) {
      navItems[4]
        .addEventListener(
          "click",
          showRecoveryHistory
        );
    }


    if (navItems[5]) {
      navItems[5]
        .addEventListener(
          "click",
          loadMedicineMaster
        );
    }

  }
);

