let approvalState = {
  status: "PENDING",
  shipment_id: null,
  selected_plan: null,
  modified_plan: null,
  decision_by: null,
  decision_reason: null,
  timestamp: null
};

function approvePlan(
  plan,
  decisionBy = "Supply Chain Manager"
) {
  if (!plan || !plan.id) {
    return {
      status: "INVALID",
      message: "A valid recovery plan is required."
    };
  }

  approvalState = {
    status: "APPROVED",

    shipment_id:
      plan.shipment_id || null,

    selected_plan: plan,

    modified_plan: null,

    decision_by: decisionBy,

    decision_reason:
      "Plan approved by human decision-maker",

    timestamp:
      new Date().toISOString()
  };

  return approvalState;
}

function rejectPlan(
  plan,
  reason,
  decisionBy = "Supply Chain Manager"
) {
  if (!plan || !plan.id) {
    return {
      status: "INVALID",
      message: "A valid recovery plan is required."
    };
  }

  if (!reason) {
    return {
      status: "INVALID",
      message: "A rejection reason is required."
    };
  }

  approvalState = {
    status: "REJECTED",

    shipment_id:
      plan.shipment_id || null,

    selected_plan: plan,

    modified_plan: null,

    decision_by: decisionBy,

    decision_reason: reason,

    timestamp:
      new Date().toISOString()
  };

  return approvalState;
}

function modifyPlan(
  plan,
  modifications,
  decisionBy = "Supply Chain Manager"
) {
  if (!plan || !plan.id) {
    return {
      status: "INVALID",
      message: "A valid recovery plan is required."
    };
  }

  if (!modifications) {
    return {
      status: "INVALID",
      message: "Modifications are required."
    };
  }

  const modifiedPlan = {
    ...plan,
    ...modifications
  };

  approvalState = {
    status: "MODIFIED",

    shipment_id:
      modifiedPlan.shipment_id ||
      plan.shipment_id ||
      null,

    selected_plan: plan,

    modified_plan: modifiedPlan,

    decision_by: decisionBy,

    decision_reason:
      "Plan modified by human decision-maker",

    timestamp:
      new Date().toISOString()
  };

  return approvalState;
}

function getApprovalState() {
  return approvalState;
}

module.exports = {
  approvePlan,
  rejectPlan,
  modifyPlan,
  getApprovalState
};