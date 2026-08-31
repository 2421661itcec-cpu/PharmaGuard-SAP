const inventory = require("../data/inventory");

function calculateTransferQuantity(
  sourceStock,
  safetyStock
) {
  const availableSurplus =
    sourceStock - safetyStock;

  if (availableSurplus <= 0) {
    return 0;
  }

  return availableSurplus;
}

function analyzeInventory(
  medicine,
  destination
) {
  const destinationInventory = inventory.find(
    item =>
      item.location === destination &&
      item.medicine === medicine
  );

  if (!destinationInventory) {
    return {
      success: false,
      status: "NOT_FOUND",
      message:
        `No inventory record found for ${medicine} ` +
        `at ${destination}.`
    };
  }

  const sourceLocations = inventory.filter(
    item =>
      item.medicine === medicine &&
      item.location !== destination
  );

  const requiredBuffer =
    destinationInventory.safety_stock +
    destinationInventory.daily_demand;

  const shortage = Math.max(
    0,
    requiredBuffer -
      destinationInventory.current_stock
  );

  if (shortage === 0) {
    return {
      success: true,
      status: "SUFFICIENT_STOCK",
      medicine,
      destination,
      current_stock:
        destinationInventory.current_stock,
      safety_stock:
        destinationInventory.safety_stock,
      daily_demand:
        destinationInventory.daily_demand,
      recommended_transfer: 0,
      message:
        "Destination has sufficient inventory."
    };
  }

  const suitableSource = sourceLocations
    .map(source => ({
      ...source,
      transferable_quantity:
        calculateTransferQuantity(
          source.current_stock,
          source.safety_stock
        )
    }))
    .filter(
      source =>
        source.transferable_quantity > 0
    )
    .sort(
      (a, b) =>
        b.transferable_quantity -
        a.transferable_quantity
    )[0];

  if (!suitableSource) {
    return {
      success: false,
      status: "NO_SOURCE_AVAILABLE",
      medicine,
      destination,
      shortage,
      message:
        "No location has sufficient surplus inventory."
    };
  }

  const transferQuantity = Math.min(
    shortage,
    suitableSource.transferable_quantity
  );

  return {
    success: true,
    status: "REBALANCE_RECOMMENDED",
    medicine,
    source: suitableSource.location,
    destination,
    current_destination_stock:
      destinationInventory.current_stock,
    safety_stock:
      destinationInventory.safety_stock,
    daily_demand:
      destinationInventory.daily_demand,
    shortage,
    recommended_transfer:
      transferQuantity,
    source_remaining_stock:
      suitableSource.current_stock -
      transferQuantity,
    message:
      `Transfer ${transferQuantity} units of ${medicine} ` +
      `from ${suitableSource.location} to ${destination}.`
  };
}

function executeInventoryTransfer(
  medicine,
  source,
  destination,
  quantity
) {
  const sourceInventory = inventory.find(
    item =>
      item.location === source &&
      item.medicine === medicine
  );

  const destinationInventory = inventory.find(
    item =>
      item.location === destination &&
      item.medicine === medicine
  );

  if (
    !sourceInventory ||
    !destinationInventory
  ) {
    return {
      success: false,
      status: "NOT_FOUND",
      message:
        "Source or destination inventory not found."
    };
  }

  if (quantity <= 0) {
    return {
      success: false,
      status: "INVALID_QUANTITY",
      message:
        "Transfer quantity must be greater than zero."
    };
  }

  const availableSurplus =
    sourceInventory.current_stock -
    sourceInventory.safety_stock;

  if (quantity > availableSurplus) {
    return {
      success: false,
      status: "INSUFFICIENT_SURPLUS",
      message:
        "Transfer quantity exceeds safe source inventory."
    };
  }

  sourceInventory.current_stock -= quantity;
  destinationInventory.current_stock += quantity;

  return {
    success: true,
    status: "TRANSFER_COMPLETED",
    medicine,
    source,
    destination,
    quantity_transferred: quantity,
    source_new_stock:
      sourceInventory.current_stock,
    destination_new_stock:
      destinationInventory.current_stock,
    message:
      `Transferred ${quantity} units of ${medicine} ` +
      `from ${source} to ${destination}.`
  };
}

module.exports = {
  analyzeInventory,
  executeInventoryTransfer
};