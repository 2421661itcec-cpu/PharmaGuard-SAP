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

      const priority =
        String(
          shipment.priority ||
          shipment.impact_level ||
          ""
        ).toLowerCase();


      const priorityClass =
        priority === "critical"
          ? "priority-critical"
          : "priority-high";


      const coverage =
        shipment.days_of_inventory_coverage;


      const coverageText =
        coverage !== undefined
          ? `${coverage} days`
          : "—";


      container.innerHTML += `

        <article class="shipment-card">

          <div class="shipment-top">

            <div class="shipment-id">
              ${escapeHtml(
                shipment.shipment_id
              )}
            </div>

            <div class="priority-badge ${priorityClass}">
              ${escapeHtml(
                shipment.priority ||
                shipment.impact_level ||
                "UNKNOWN"
              )}
            </div>

          </div>


          <div class="shipment-medicine">
            ${escapeHtml(
              shipment.medicine
            )}
          </div>


          <div class="route">
            ${escapeHtml(
              shipment.current_route ||
              `${shipment.origin || ""} → ${shipment.destination || ""}`
            )}
          </div>


          <div class="metrics">

            <div class="metric">
              <span>IMPACT</span>
              <strong>
                ${escapeHtml(
                  shipment.impact_level || "—"
                )}
              </strong>
            </div>


            <div class="metric">
              <span>DELAY RISK</span>
              <strong>
                ${escapeHtml(
                  shipment.delay_risk || "—"
                )}
              </strong>
            </div>


            <div class="metric">
              <span>INVENTORY</span>
              <strong>
                ${escapeHtml(
                  coverageText
                )}
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


      card.innerHTML = `

        <div class="rank">
          RANK #${escapeHtml(
            plan.rank
          )}
        </div>


        <h3>
          ${escapeHtml(
            plan.name
          )}
        </h3>


        <div class="scenario-route">
          ${escapeHtml(
            plan.route
          )}
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


  container.innerHTML = `

    <div class="selected-plan-header">

      <strong>
        ${escapeHtml(
          selectedPlan.name
        )}
      </strong>

      <span class="selected-plan-id">
        ${escapeHtml(
          selectedPlan.id
        )}
      </span>

    </div>


    <div class="selected-plan-route">
      ${escapeHtml(
        selectedPlan.route
      )}
    </div>


    <div class="scenario-metrics">

      <div class="scenario-metric">
        ETA ${escapeHtml(
          selectedPlan.eta_hours
        )}h
      </div>

      <div class="scenario-metric">
        RISK ${escapeHtml(
          selectedPlan.risk
        )}
      </div>

      <div class="scenario-metric">
        COST ${escapeHtml(
          selectedPlan.cost_level
        )}
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
      route.focus();
      route.select();
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


    renderSelectedPlan();


    renderDecisionSummary(
      selectedPlan
    );


    hide(
      "modifySection"
    );


    showToast(
      "Plan modified by human. Executing recovery..."
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
        "Real-time simulated shipment positions across the pharmaceutical supply network.",
        `
          <div class="nm-wrapper">
            <div class="nm-status-bar">
              <span class="nm-live-dot"></span>
              <span class="nm-live-label">SIMULATED LIVE TRACKING</span>
              <span class="nm-last-update" id="nmLastUpdate">Connecting...</span>
            </div>
            <div id="nmMapContainer" class="nm-map-container"></div>
            <div class="nm-legend">
              <div class="nm-legend-item">
                <span class="nm-legend-dot nm-dot-critical"></span> Critical
              </div>
              <div class="nm-legend-item">
                <span class="nm-legend-dot nm-dot-high"></span> High
              </div>
              <div class="nm-legend-item">
                <span class="nm-legend-dot nm-dot-medium"></span> Medium
              </div>
              <div class="nm-legend-item">
                <span class="nm-legend-dot nm-dot-rerouted"></span> Rerouted
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


    function initNetworkMap() {

      // Guard: Leaflet must be loaded
      if (typeof L === "undefined") {
        const container = document.getElementById("nmMapContainer");
        if (container) {
          container.innerHTML =
            '<div class="pg4-error" style="padding:40px;">Map library unavailable. The rest of PharmaGuard continues to work normally.</div>';
        }
        return;
      }

      const mapEl = document.getElementById("nmMapContainer");
      if (!mapEl) return;

      // India center
      const map = L.map(mapEl, {
        center: [22.5, 80.0],
        zoom: 5,
        zoomControl: true
      });

      // OpenStreetMap tiles — no API key required
      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18
        }
      ).addTo(map);

      // Marker color by priority/status
      function markerColor(priority, status) {
        if (
          status &&
          String(status).toLowerCase() === "rerouted"
        ) {
          return "#7c3aed";
        }
        const p = String(priority || "").toLowerCase();
        if (p === "critical") return "#dc2626";
        if (p === "high")     return "#ea580c";
        return "#ca8a04";
      }

      function createIcon(priority, status) {
        const color = markerColor(priority, status);
        return L.divIcon({
          className: "",
          html: `<div style="
            width:18px;height:18px;
            background:${color};
            border:3px solid #fff;
            border-radius:50%;
            box-shadow:0 2px 8px rgba(0,0,0,0.35);
          "></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          popupAnchor: [0, -12]
        });
      }

      const markers = {};
      let lastUpdateTime = null;
      let socket = null;
      let lastUpdateInterval = null;

      function formatPopup(t) {
        const eta = t.eta_hours != null ? `${t.eta_hours}h` : "—";
        const statusLabel = t.status || "In Transit";
        return `
          <div style="min-width:160px;font-family:sans-serif;">
            <div style="font-weight:800;font-size:14px;margin-bottom:4px;">
              ${escapeHtml(t.shipment_id)}
            </div>
            <div style="font-size:13px;font-weight:600;margin-bottom:6px;">
              ${escapeHtml(t.medicine)}
            </div>
            <div style="font-size:11px;color:#64748b;margin-bottom:2px;">
              ${escapeHtml(t.route || "")}
            </div>
            <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
              <span style="background:${markerColor(t.priority, t.status)};
                color:#fff;padding:2px 8px;border-radius:999px;
                font-size:11px;font-weight:700;">
                ${escapeHtml(t.priority || "")}
              </span>
              <span style="background:#f1f5f9;color:#334155;padding:2px 8px;
                border-radius:999px;font-size:11px;font-weight:700;">
                ${escapeHtml(statusLabel)}
              </span>
            </div>
            <div style="margin-top:6px;font-size:12px;color:#334155;">
              ETA: <strong>${eta}</strong>
            </div>
            <div style="margin-top:2px;font-size:11px;color:#94a3b8;">
              ${escapeHtml(t.origin || "")} → ${escapeHtml(t.destination || "")}
            </div>
          </div>
        `;
      }

      function placeOrMoveMarker(t) {
        if (!t.latitude || !t.longitude) return;
        const latlng = [t.latitude, t.longitude];

        if (markers[t.shipment_id]) {
          markers[t.shipment_id].setLatLng(latlng);
          markers[t.shipment_id].setIcon(
            createIcon(t.priority, t.status)
          );
          if (markers[t.shipment_id].getPopup()) {
            markers[t.shipment_id].getPopup().setContent(formatPopup(t));
          }
        } else {
          const m = L.marker(latlng, {
            icon: createIcon(t.priority, t.status)
          })
            .addTo(map)
            .bindPopup(formatPopup(t), { maxWidth: 240 });

          markers[t.shipment_id] = m;
        }
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
          const list = result.tracking || [];
          list.forEach(placeOrMoveMarker);

          if (list.length > 0) {
            const bounds = list
              .filter(t => t.latitude && t.longitude)
              .map(t => [t.latitude, t.longitude]);

            if (bounds.length > 0) {
              map.fitBounds(bounds, { padding: [60, 60] });
            }
          }
        })
        .catch(() => {
          // Non-fatal — live socket will populate markers
        });

      // Connect Socket.IO for live position updates
      try {
        socket = io({
          transports: ["websocket", "polling"]
        });

        socket.on("connect", () => {
          const el = document.getElementById("nmLastUpdate");
          if (el) el.textContent = "Connected — waiting for update...";
        });

        socket.on("trackingUpdate", (trackingList) => {
          lastUpdateTime = Date.now();
          trackingList.forEach(placeOrMoveMarker);
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
        } catch (e) {
          // map already removed
        }
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
    // NAVIGATION EVENTS
    // navItems[0] = Command Center
    // navItems[1] = Shipments
    // navItems[2] = Network Map
    // navItems[3] = Inventory
    // navItems[4] = Recovery History
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

  }
);
